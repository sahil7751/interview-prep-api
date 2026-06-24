package com.jobtracker.service;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jobtracker.dto.request.GenerateRoadmapRequest;
import com.jobtracker.dto.response.MilestoneResponse;
import com.jobtracker.dto.response.RoadmapResponse;
import com.jobtracker.dto.response.RoadmapResponse.WeekSummary;
import com.jobtracker.entity.*;
import com.jobtracker.repository.*;
import com.jobtracker.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class RoadmapService {

    private final SkillRoadmapRepository roadmapRepository;
    private final RoadmapMilestoneRepository milestoneRepository;
    private final SecurityUtils securityUtils;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${groq.api.key:}")
    private String groqApiKey;

    @Value("${groq.api.url:https://api.groq.com/openai/v1/chat/completions}")
    private String groqApiUrl;

    @Value("${groq.api.model:llama-3.3-70b-versatile}")
    private String groqModel;

    // ── GENERATE ROADMAP ─────────────────────────────────────────
    @Transactional
    public RoadmapResponse generateRoadmap(
            GenerateRoadmapRequest request) {

        User user = securityUtils.getCurrentUser();

        // Auto-fill skills from profile
        String skills = request.getCurrentSkills();
        if (skills == null || skills.isBlank()) {
            skills = "Not specified";
        }

        // Call AI
        String prompt = buildPrompt(request, skills);
        List<RawMilestone> rawMilestones = callGroqForRoadmap(prompt, request.getDurationWeeks());

        // Save roadmap
        SkillRoadmap roadmap = SkillRoadmap.builder()
                .user(user)
                .targetRole(request.getTargetRole())
                .experienceLevel(request.getExperienceLevel())
                .currentSkills(skills)
                .durationWeeks(request.getDurationWeeks())
                .totalMilestones(rawMilestones.size())
                .build();

        roadmap = roadmapRepository.save(roadmap);

        // Save milestones
        List<RoadmapMilestone> milestones = new ArrayList<>();
        for (int i = 0; i < rawMilestones.size(); i++) {
            RawMilestone rm = rawMilestones.get(i);
            RoadmapMilestone m = RoadmapMilestone.builder()
                    .roadmap(roadmap)
                    .weekNumber(rm.weekNumber)
                    .weekTitle(rm.weekTitle)
                    .topic(rm.topic)
                    .description(rm.description)
                    .resource(rm.resource)
                    .resourceType(rm.resourceType)
                    .estimatedHours(rm.estimatedHours > 0
                            ? rm.estimatedHours
                            : 3)
                    .orderIndex(i)
                    .category(rm.category)
                    .isCompleted(false)
                    .build();
            milestones.add(milestoneRepository.save(m));
        }

        log.info("Roadmap generated: {} milestones for {}",
                milestones.size(), user.getEmail());

        return toResponse(roadmap, milestones);
    }

    // ── GET ALL ROADMAPS ─────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<RoadmapResponse> getAllRoadmaps() {
            User user = securityUtils.getCurrentUser();
            return roadmapRepository
                            .findByUserOrderByCreatedAtDesc(user)
                            .stream()
                            .map(r -> RoadmapResponse.builder()
                                            .id(r.getId())
                                            .targetRole(r.getTargetRole())
                                            .experienceLevel(r.getExperienceLevel())
                                            .currentSkills(r.getCurrentSkills())
                                            .durationWeeks(r.getDurationWeeks())
                                            .totalMilestones(r.getTotalMilestones())
                                            .completedMilestones(r.getCompletedMilestones())
                                            .completionPercent(r.getCompletionPercent())
                                            .active(r.isActive())
                                            .createdAt(r.getCreatedAt())
                                            .weeklyPlan(new java.util.TreeMap<>())
                                            .weekSummaries(new java.util.ArrayList<>())
                                            .build())
                            .toList();
    }

    // ── GET ONE ROADMAP ──────────────────────────────────────────
    @Transactional(readOnly = true)
    public RoadmapResponse getRoadmap(Long id) {
        User user = securityUtils.getCurrentUser();
        SkillRoadmap roadmap = roadmapRepository
                .findByIdAndUser(id, user)
                .orElseThrow(() -> new RuntimeException("Roadmap not found"));

        List<RoadmapMilestone> milestones = milestoneRepository
                .findByRoadmapOrderByWeekNumberAscOrderIndexAsc(
                        roadmap);

        return toResponse(roadmap, milestones);
    }

    // ── TOGGLE MILESTONE ─────────────────────────────────────────
    @Transactional
    public RoadmapResponse toggleMilestone(Long roadmapId,
            Long milestoneId) {
        User user = securityUtils.getCurrentUser();

        SkillRoadmap roadmap = roadmapRepository
                .findByIdAndUser(roadmapId, user)
                .orElseThrow(() -> new RuntimeException("Roadmap not found"));

        RoadmapMilestone milestone = milestoneRepository
                .findByIdAndRoadmap(milestoneId, roadmap)
                .orElseThrow(() -> new RuntimeException("Milestone not found"));

        // Toggle
        milestone.setCompleted(!milestone.isCompleted());
        milestone.setCompletedAt(milestone.isCompleted()
                ? LocalDateTime.now()
                : null);
        milestoneRepository.save(milestone);

        // Update roadmap progress
        long completed = milestoneRepository
                .countByRoadmapAndIsCompletedTrue(roadmap);
        int total = roadmap.getTotalMilestones();
        int percent = total > 0
                ? (int) Math.round((completed * 100.0) / total)
                : 0;

        roadmap.setCompletedMilestones((int) completed);
        roadmap.setCompletionPercent(percent);
        roadmapRepository.save(roadmap);

        List<RoadmapMilestone> milestones = milestoneRepository
                .findByRoadmapOrderByWeekNumberAscOrderIndexAsc(
                        roadmap);

        return toResponse(roadmap, milestones);
    }

    // ── DELETE ROADMAP ───────────────────────────────────────────
    @Transactional
    public void deleteRoadmap(Long id) {
        User user = securityUtils.getCurrentUser();
        SkillRoadmap roadmap = roadmapRepository
                .findByIdAndUser(id, user)
                .orElseThrow(() -> new RuntimeException("Roadmap not found"));
        roadmapRepository.delete(roadmap);
    }

    // ── AI CALL ──────────────────────────────────────────────────
    private List<RawMilestone> callGroqForRoadmap(
            String prompt, int durationWeeks) {
        try {
            String raw = callGroq(prompt);
            String cleaned = cleanJson(raw);

            // Parse as array
            int arrStart = cleaned.indexOf('[');
            int arrEnd = cleaned.lastIndexOf(']');
            if (arrStart != -1 && arrEnd != -1) {
                cleaned = cleaned.substring(arrStart, arrEnd + 1);
            }

            RawMilestone[] arr = objectMapper.readValue(
                    cleaned, RawMilestone[].class);
            return Arrays.asList(arr);

        } catch (Exception e) {
            log.error("Roadmap generation failed: {}",
                    e.getMessage());
            return buildFallbackMilestones(durationWeeks);
        }
    }

    private String buildPrompt(GenerateRoadmapRequest req,
            String skills) {
        return """
                You are an expert tech career coach.
                Create a detailed %d-week learning roadmap.
                Return ONLY a valid JSON array, no markdown.

                Target Role: %s
                Experience Level: %s
                Current Skills: %s

                Return this exact JSON array structure:
                [
                  {
                    "weekNumber": 1,
                    "weekTitle": "<e.g. Java Foundations>",
                    "topic": "<specific topic to learn>",
                    "description": "<what to learn and why>",
                    "resource": "<specific book/course/platform>",
                    "resourceType": "<Video|Book|Practice|Project|Article>",
                    "estimatedHours": <integer 2-8>,
                    "category": "<Foundation|Core|Advanced|Project|Interview Prep>"
                  }
                ]

                Rules:
                - Generate exactly 4-5 milestones per week
                - Total milestones: %d weeks × 4-5 = %d to %d items
                - Progress logically: Foundation → Core → Advanced → Projects → Interview Prep
                - Include mix of theory, practice, and projects
                - Resources must be real and specific
                  (e.g. "Udemy - Java Masterclass by Tim Buchalka",
                        "LeetCode Easy Arrays",
                        "Build a REST API project")
                - Last 1-2 weeks should be interview preparation
                - Be specific to the target role, not generic
                """.formatted(
                req.getDurationWeeks(),
                req.getTargetRole(),
                req.getExperienceLevel(),
                skills,
                req.getDurationWeeks(),
                req.getDurationWeeks() * 4,
                req.getDurationWeeks() * 5);
    }

    // ── GROQ ─────────────────────────────────────────────────────
    private String callGroq(String prompt) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(groqApiKey);

        Map<String, Object> message = Map.of(
                "role", "user", "content", prompt);

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("model", groqModel);
        body.put("messages", List.of(message));
        body.put("temperature", 0.3);
        body.put("max_tokens", 4096);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

        ResponseEntity<Map> response = restTemplate.exchange(
                groqApiUrl, HttpMethod.POST, entity, Map.class);

        Map<?, ?> rb = response.getBody();
        if (rb == null)
            throw new RuntimeException("Empty response");
        List<?> choices = (List<?>) rb.get("choices");
        Map<?, ?> choice = (Map<?, ?>) choices.get(0);
        Map<?, ?> msg = (Map<?, ?>) choice.get("message");
        return msg.get("content").toString();
    }

    private String cleanJson(String raw) {
        return raw.replaceAll("(?s)```json\\s*", "")
                .replaceAll("(?s)```\\s*", "")
                .trim();
    }

    // ── MAPPER ───────────────────────────────────────────────────
    private RoadmapResponse toResponse(SkillRoadmap roadmap,
            List<RoadmapMilestone> milestones) {

        List<MilestoneResponse> mList = milestones.stream()
                .map(m -> MilestoneResponse.builder()
                        .id(m.getId())
                        .weekNumber(m.getWeekNumber())
                        .weekTitle(m.getWeekTitle())
                        .topic(m.getTopic())
                        .description(m.getDescription())
                        .resource(m.getResource())
                        .resourceType(m.getResourceType())
                        .estimatedHours(m.getEstimatedHours())
                        .orderIndex(m.getOrderIndex())
                        .completed(m.isCompleted())
                        .completedAt(m.getCompletedAt())
                        .category(m.getCategory())
                        .build())
                .toList();

        // Group by week
        Map<Integer, List<MilestoneResponse>> weeklyPlan = mList.stream().collect(
                Collectors.groupingBy(
                        MilestoneResponse::getWeekNumber,
                        TreeMap::new,
                        Collectors.toList()));

        // Week summaries
        List<WeekSummary> weekSummaries = weeklyPlan.entrySet()
                .stream()
                .map(e -> {
                    List<MilestoneResponse> wm = e.getValue();
                    int totalHours = wm.stream()
                            .mapToInt(
                                    MilestoneResponse::getEstimatedHours)
                            .sum();
                    long completedCount = wm.stream()
                            .filter(MilestoneResponse::isCompleted)
                            .count();
                    String weekTitle = wm.isEmpty() ? ""
                            : wm.get(0).getWeekTitle();
                    String category = wm.isEmpty() ? ""
                            : wm.get(0).getCategory();
                    return WeekSummary.builder()
                            .weekNumber(e.getKey())
                            .title(weekTitle)
                            .totalTopics(wm.size())
                            .completedTopics((int) completedCount)
                            .estimatedHours(totalHours)
                            .category(category)
                            .build();
                })
                .toList();

        return RoadmapResponse.builder()
                .id(roadmap.getId())
                .targetRole(roadmap.getTargetRole())
                .experienceLevel(roadmap.getExperienceLevel())
                .currentSkills(roadmap.getCurrentSkills())
                .durationWeeks(roadmap.getDurationWeeks())
                .totalMilestones(roadmap.getTotalMilestones())
                .completedMilestones(roadmap.getCompletedMilestones())
                .completionPercent(roadmap.getCompletionPercent())
                .active(roadmap.isActive())
                .createdAt(roadmap.getCreatedAt())
                .weeklyPlan(weeklyPlan)
                .weekSummaries(weekSummaries)
                .build();
    }

    // ── FALLBACK ─────────────────────────────────────────────────
    private List<RawMilestone> buildFallbackMilestones(
            int weeks) {
        List<RawMilestone> list = new ArrayList<>();
        String[] topics = {
                "Core Language Fundamentals",
                "Data Structures",
                "Algorithms",
                "Project Build",
                "Interview Preparation"
        };
        for (int w = 1; w <= Math.min(weeks, 5); w++) {
            RawMilestone m = new RawMilestone();
            m.weekNumber = w;
            m.weekTitle = "Week " + w;
            m.topic = topics[w - 1];
            m.description = "Study " + topics[w - 1];
            m.resource = "Online documentation";
            m.resourceType = "Article";
            m.estimatedHours = 5;
            m.category = w <= 2 ? "Foundation" : "Core";
            list.add(m);
        }
        return list;
    }

    // ── Inner classes ─────────────────────────────────────────────
    @JsonIgnoreProperties(ignoreUnknown = true)
    @lombok.Data
    @lombok.NoArgsConstructor
    public static class RawMilestone {
        private int weekNumber;
        private String weekTitle;
        private String topic;
        private String description;
        private String resource;
        private String resourceType;
        private int estimatedHours;
        private String category;
    }
}

