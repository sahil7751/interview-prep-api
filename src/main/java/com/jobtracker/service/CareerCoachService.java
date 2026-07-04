package com.jobtracker.service;

import com.jobtracker.dto.request.CareerCoachRequest;
import com.jobtracker.dto.response.CareerCoachResponse;
import com.jobtracker.entity.User;
import com.jobtracker.repository.*;
import com.jobtracker.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class CareerCoachService {

    private final RestTemplate restTemplate;
    private final SecurityUtils securityUtils;
    private final UserProfileRepository profileRepository;
    private final ApplicationRepository applicationRepository;
    private final InterviewQaRecordRepository qaRepository;
    private final InterviewPracticeSessionRepository sessionRepository;
    private final UserGamificationRepository gamificationRepository;
    private final ResumeRepository resumeRepository;

    @Value("${groq.api.key:}")
    private String groqApiKey;

    @Value("${groq.api.url:https://api.groq.com/openai/v1/chat/completions}")
    private String groqApiUrl;

    @Value("${groq.api.model:llama-3.3-70b-versatile}")
    private String groqModel;

    private static final String SYSTEM_PROMPT = """
            You are CareerPilot AI — an expert AI Career Coach and personal mentor
            specializing in helping engineering students and software developers
            succeed in placements and career growth.

            YOUR PERSONALITY:
            - Encouraging, empathetic, and motivating
            - Specific and actionable (never vague)
            - Data-driven (use the user's actual stats)
            - Like a senior friend who is also a tech expert
            - Celebrate wins, address struggles with empathy

            YOUR EXPERTISE:
            - Campus and off-campus placement strategy
            - DSA preparation (LeetCode, HackerRank, Codeforces)
            - Technical interviews (Java, Python, Spring Boot, React, etc.)
            - System design interviews
            - HR and behavioral interviews (STAR method)
            - Resume optimization and ATS improvement
            - Career planning (service vs product, startup vs MNC)
            - Skill gap analysis and learning roadmaps
            - Company-specific preparation (Google, Amazon, TCS, etc.)
            - Salary negotiation and offer evaluation
            - Portfolio and GitHub profile improvement

            RESPONSE STYLE:
            - Use **bold** for important points
            - Use bullet lists for steps and tips
            - Keep responses focused (not too long)
            - Add emoji sparingly for warmth
            - Use code blocks when showing code
            - Always end with an actionable next step
            - Reference the user's actual data when available

            IMPORTANT: You have access to the user's complete profile below.
            Use this data to give personalized advice. Never ask for information
            that is already available.
            """;

    // ── CHAT ─────────────────────────────────────────────────────
    public CareerCoachResponse chat(CareerCoachRequest request) {
        User user = securityUtils.getCurrentUser();
        String fullContext = buildFullContext(user);
        List<Map<String, String>> messages = buildMessages(
                request, fullContext);

        log.info("Career coach: {} messages for {}",
                messages.size(), user.getEmail());

        String response = callGroq(messages);

        return CareerCoachResponse.builder()
                .message(response)
                .role("assistant")
                .build();
    }

    // ── DAILY INSIGHT ─────────────────────────────────────────────
    public Map<String, String> getDailyInsight() {
        User user = securityUtils.getCurrentUser();
        String context = buildFullContext(user);

        String prompt = context + """

                Generate a brief daily coaching insight for this user.
                Return a JSON object with these exact keys:
                {
                  "goal": "<today's specific goal>",
                  "tip": "<one actionable tip>",
                  "challenge": "<one specific challenge>",
                  "motivation": "<one motivational message tailored to their level>"
                }
                Be specific to their profile. No markdown, just raw JSON.
                """;

        try {
            List<Map<String, String>> msgs = List.of(
                    Map.of("role", "user", "content", prompt));
            String raw = callGroq(msgs);
            String cleaned = raw
                    .replaceAll("(?s)```json\\s*", "")
                    .replaceAll("(?s)```\\s*", "").trim();
            int s = cleaned.indexOf('{');
            int e = cleaned.lastIndexOf('}');
            if (s != -1 && e != -1)
                cleaned = cleaned.substring(s, e + 1);

            com.fasterxml.jackson.databind.ObjectMapper om = new com.fasterxml.jackson.databind.ObjectMapper();
            return om.readValue(cleaned,
                    new com.fasterxml.jackson.core.type.TypeReference<>() {
                    });
        } catch (Exception ex) {
            return Map.of(
                    "goal", "Complete one LeetCode problem today",
                    "tip", "Focus on array problems for placement prep",
                    "challenge", "Solve one medium difficulty problem",
                    "motivation", "Every expert was once a beginner. Keep going!");
        }
    }

    // ── WEEKLY REVIEW ─────────────────────────────────────────────
    public Map<String, Object> getWeeklyReview() {
        User user = securityUtils.getCurrentUser();

        long apps = applicationRepository.countByUser(user);
        long sessions = sessionRepository.countByUser(user);
        long questions = qaRepository.countByUserAndIsEvaluatedTrue(user);
        Double avgScore = qaRepository.findAverageScoreByUser(user);

        var gam = gamificationRepository.findByUser(user).orElse(null);
        int xp = gam != null ? gam.getTotalXp() : 0;
        int streak = gam != null ? gam.getCurrentStreak() : 0;

        Map<String, Object> review = new LinkedHashMap<>();
        review.put("applicationsSubmitted", apps);
        review.put("practiceSessionsCompleted", sessions);
        review.put("questionsAnswered", questions);
        review.put("averageScore",
                avgScore != null
                        ? Math.round(avgScore * 10.0) / 10.0
                        : 0.0);
        review.put("totalXp", xp);
        review.put("currentStreak", streak);

        return review;
    }

    // ── BUILD FULL CONTEXT ────────────────────────────────────────
    private String buildFullContext(User user) {
        StringBuilder ctx = new StringBuilder();
        ctx.append("\n\n=== USER PROFILE ===\n");
        ctx.append("Name: ").append(user.getName()).append("\n");
        ctx.append("Email: ").append(user.getEmail()).append("\n");

        profileRepository.findByUser(user).ifPresent(p -> {
            if (p.getCollegeName() != null)
                ctx.append("College: ").append(p.getCollegeName())
                        .append("\n");
            if (p.getDegree() != null)
                ctx.append("Degree: ").append(p.getDegree())
                        .append(" in ").append(
                                p.getBranch() != null ? p.getBranch() : "")
                        .append("\n");
            if (p.getGraduationYear() != null)
                ctx.append("Graduation: ").append(p.getGraduationYear())
                        .append("\n");
            if (p.getCgpa() != null)
                ctx.append("CGPA: ").append(p.getCgpa()).append("\n");
            if (p.getSkills() != null)
                ctx.append("Skills: ").append(p.getSkills()).append("\n");
            if (p.getTargetRoleGoal() != null)
                ctx.append("Target Role: ")
                        .append(p.getTargetRoleGoal()).append("\n");
            if (p.getPreferredCompanies() != null)
                ctx.append("Preferred Companies: ")
                        .append(p.getPreferredCompanies()).append("\n");
            if (p.getExpectedSalary() != null)
                ctx.append("Expected Salary: ")
                        .append(p.getExpectedSalary()).append("\n");
            if (p.getGithubUrl() != null)
                ctx.append("GitHub: Present\n");
            if (p.getLinkedinUrl() != null)
                ctx.append("LinkedIn: Present\n");
            if (p.getCurrentRole() != null)
                ctx.append("Current Role: ")
                        .append(p.getCurrentRole()).append("\n");
        });

        // Applications
        long totalApps = applicationRepository.countByUser(user);
        ctx.append("\n=== APPLICATIONS ===\n");
        ctx.append("Total Applications: ").append(totalApps).append("\n");

        // Resume
        resumeRepository.findByUserAndIsActiveTrue(user).ifPresent(r -> {
            ctx.append("\n=== RESUME ===\n");
            ctx.append("Active Resume: ").append(r.getLabel()).append("\n");
            ctx.append("Version: ").append(r.getVersionNumber()).append("\n");
            if (r.getAtsScore() != null)
                ctx.append("ATS Score: ")
                        .append(r.getAtsScore()).append("/100\n");
        });

        // Practice
        long sessions = sessionRepository.countByUser(user);
        long questions = qaRepository.countByUserAndIsEvaluatedTrue(user);
        Double avgScore = qaRepository.findAverageScoreByUser(user);

        ctx.append("\n=== INTERVIEW PRACTICE ===\n");
        ctx.append("Total Sessions: ").append(sessions).append("\n");
        ctx.append("Questions Answered: ").append(questions).append("\n");
        if (avgScore != null)
            ctx.append("Average Score: ")
                    .append(Math.round(avgScore * 10.0) / 10.0)
                    .append("/10\n");

        // Gamification
        gamificationRepository.findByUser(user).ifPresent(g -> {
            ctx.append("\n=== PROGRESS ===\n");
            ctx.append("Level: ").append(g.getCurrentLevel()).append("\n");
            ctx.append("Total XP: ").append(g.getTotalXp()).append("\n");
            ctx.append("Current Streak: ")
                    .append(g.getCurrentStreak()).append(" days\n");
            ctx.append("Longest Streak: ")
                    .append(g.getLongestStreak()).append(" days\n");
        });

        ctx.append("\n=== COACHING INSTRUCTIONS ===\n");
        ctx.append("Use the above data to give personalized, specific advice.\n");
        ctx.append("Reference actual numbers when relevant.\n");
        ctx.append("Be encouraging and action-oriented.\n");

        return ctx.toString();
    }

    private List<Map<String, String>> buildMessages(
            CareerCoachRequest request, String context) {

        List<Map<String, String>> messages = new ArrayList<>();

        // System message
        messages.add(Map.of(
                "role", "system",
                "content", SYSTEM_PROMPT + context));

        // Conversation history (last 20 messages)
        List<CareerCoachRequest.ChatMessage> history = request.getMessages();
        int start = Math.max(0, history.size() - 20);
        for (int i = start; i < history.size(); i++) {
            var msg = history.get(i);
            if (msg.getRole() != null && msg.getContent() != null
                    && !msg.getContent().isBlank()) {
                messages.add(Map.of(
                        "role", msg.getRole(),
                        "content", msg.getContent()));
            }
        }
        return messages;
    }

    private String callGroq(List<Map<String, String>> messages) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(groqApiKey);

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("model", groqModel);
        body.put("messages", messages);
        body.put("temperature", 0.7);
        body.put("max_tokens", 1024);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<Map> response = restTemplate.exchange(
                    groqApiUrl, HttpMethod.POST,
                    entity, Map.class);

            Map<?, ?> rb = response.getBody();
            if (rb == null)
                throw new RuntimeException("Empty response");
            List<?> choices = (List<?>) rb.get("choices");
            Map<?, ?> choice = (Map<?, ?>) choices.get(0);
            Map<?, ?> msg = (Map<?, ?>) choice.get("message");
            return msg.get("content").toString();
        } catch (Exception e) {
            log.error("Groq error: {}", e.getMessage());
            throw new RuntimeException(
                    "AI service error: " + e.getMessage());
        }
    }
}

