package com.jobtracker.service;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jobtracker.dto.request.JobMatchRequest;
import com.jobtracker.dto.response.JobMatchResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.io.RandomAccessReadBuffer;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class JobMatchService {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${groq.api.key:}")
    private String groqApiKey;

    @Value("${groq.api.url:https://api.groq.com/openai/v1/chat/completions}")
    private String groqApiUrl;

    @Value("${groq.api.model:llama-3.3-70b-versatile}")
    private String groqModel;

    // ── ANALYZE FROM TEXT ────────────────────────────────────────
    public JobMatchResponse analyzeMatch(JobMatchRequest request) {
        return performAnalysis(
                request.getResumeText(),
                request.getJobDescription(),
                request.getTargetRole(),
                request.getExperienceLevel());
    }

    // ── ANALYZE FROM PDF ─────────────────────────────────────────
    public JobMatchResponse analyzeMatchPdf(
            MultipartFile file,
            String jobDescription,
            String targetRole,
            String experienceLevel) throws IOException {

        // Validate
        if (file.isEmpty()) {
            throw new RuntimeException("File is empty");
        }
        String name = file.getOriginalFilename();
        if (name == null || !name.toLowerCase().endsWith(".pdf")) {
            throw new RuntimeException("Only PDF files accepted");
        }
        if (file.getSize() > 5 * 1024 * 1024) {
            throw new RuntimeException("File must be under 5 MB");
        }

        // Extract text
        String resumeText = extractPdfText(file);
        if (resumeText == null || resumeText.isBlank()) {
            throw new RuntimeException(
                    "Could not extract text from PDF.");
        }

        return performAnalysis(resumeText, jobDescription,
                targetRole, experienceLevel);
    }

    // ── CORE ANALYSIS ────────────────────────────────────────────
    private JobMatchResponse performAnalysis(
            String resumeText,
            String jobDescription,
            String targetRole,
            String experienceLevel) {

        String prompt = buildPrompt(resumeText, jobDescription,
                targetRole, experienceLevel);

        try {
            String raw = callGroq(prompt);
            String cleaned = cleanJson(raw);

            log.info("Job match analysis received");
            RawMatchResult raw2 = objectMapper.readValue(
                    cleaned, RawMatchResult.class);

            return JobMatchResponse.builder()
                    .matchScore(clamp(raw2.matchScore, 0, 100))
                    .matchLabel(getMatchLabel(raw2.matchScore))
                    .overallFeedback(raw2.overallFeedback)
                    .recommendation(raw2.recommendation)
                    .matchedSkills(safe(raw2.matchedSkills))
                    .missingSkills(safe(raw2.missingSkills))
                    .partialSkills(safe(raw2.partialSkills))
                    .matchedKeywords(safe(raw2.matchedKeywords))
                    .missingKeywords(safe(raw2.missingKeywords))
                    .experienceMatch(raw2.experienceMatch)
                    .educationMatch(raw2.educationMatch)
                    .experienceFeedback(raw2.experienceFeedback)
                    .educationFeedback(raw2.educationFeedback)
                    .skillsScore(clamp(raw2.skillsScore, 0, 100))
                    .keywordsScore(clamp(raw2.keywordsScore, 0, 100))
                    .experienceScore(
                            clamp(raw2.experienceScore, 0, 100))
                    .educationScore(
                            clamp(raw2.educationScore, 0, 100))
                    .overallFormatScore(
                            clamp(raw2.overallFormatScore, 0, 100))
                    .topImprovements(safe(raw2.topImprovements))
                    .resumeTweaks(safe(raw2.resumeTweaks))
                    .skillsToLearn(safe(raw2.skillsToLearn))
                    .estimatedTimeToReady(
                            raw2.estimatedTimeToReady)
                    .build();

        } catch (Exception e) {
            log.error("Job match parse failed: {}",
                    e.getMessage());
            throw new RuntimeException(
                    "Analysis failed: " + e.getMessage());
        }
    }

    // ── PROMPT ───────────────────────────────────────────────────
    private String buildPrompt(String resumeText,
            String jobDescription,
            String targetRole,
            String experienceLevel) {
        return """
                You are an expert recruiter and career coach.
                Analyze how well this resume matches the job description.
                Return ONLY valid JSON, no markdown, no extra text.

                Target Role: %s
                Experience Level: %s

                Resume:
                %s

                Job Description:
                %s

                Return this exact JSON:
                {
                  "matchScore": <integer 0-100>,
                  "overallFeedback": "<2-3 sentence assessment>",
                  "recommendation": "<Apply now|Improve first|Not ready>",
                  "matchedSkills": ["<skill present in both>"],
                  "missingSkills": ["<skill required but absent>"],
                  "partialSkills": ["<skill partially matching>"],
                  "matchedKeywords": ["<keyword found in resume>"],
                  "missingKeywords": ["<keyword missing from resume>"],
                  "experienceMatch": "<Meets|Below|Exceeds>",
                  "educationMatch": "<Meets|Below|Exceeds>",
                  "experienceFeedback": "<specific experience feedback>",
                  "educationFeedback": "<specific education feedback>",
                  "skillsScore": <0-100>,
                  "keywordsScore": <0-100>,
                  "experienceScore": <0-100>,
                  "educationScore": <0-100>,
                  "overallFormatScore": <0-100>,
                  "topImprovements": [
                    "<most impactful improvement ordered by priority>"
                  ],
                  "resumeTweaks": [
                    "<quick resume edit to improve match>"
                  ],
                  "skillsToLearn": [
                    "<skill to acquire for this role>"
                  ],
                  "estimatedTimeToReady": "<Ready now|1-2 days|1 week|2-4 weeks|1-2 months>"
                }

                Scoring:
                - matchScore = weighted average of all category scores
                - skillsScore: 40%% weight
                - keywordsScore: 25%% weight
                - experienceScore: 20%% weight
                - educationScore: 10%% weight
                - overallFormatScore: 5%% weight
                - Be strict and realistic in scoring
                - topImprovements: max 5 items, ordered by impact
                - resumeTweaks: quick edits (rewording, adding keywords)
                - skillsToLearn: only genuinely missing technical skills
                """.formatted(
                targetRole != null ? targetRole : "Not specified",
                experienceLevel != null ? experienceLevel : "Fresher",
                resumeText.length() > 3000
                        ? resumeText.substring(0, 3000)
                        : resumeText,
                jobDescription.length() > 2000
                        ? jobDescription.substring(0, 2000)
                        : jobDescription);
    }

    // ── HELPERS ──────────────────────────────────────────────────
    private String extractPdfText(MultipartFile file)
            throws IOException {
        try (PDDocument doc = Loader.loadPDF(
                new RandomAccessReadBuffer(
                        file.getInputStream()))) {
            PDFTextStripper s = new PDFTextStripper();
            s.setSortByPosition(true);
            return s.getText(doc);
        }
    }

    private String callGroq(String prompt) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(groqApiKey);

        Map<String, Object> message = Map.of(
                "role", "user", "content", prompt);

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("model", groqModel);
        body.put("messages", List.of(message));
        body.put("temperature", 0.2);
        body.put("max_tokens", 2500);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<Map> response = restTemplate.exchange(
                    groqApiUrl, HttpMethod.POST,
                    entity, Map.class);

            Map<?, ?> rb = response.getBody();
            if (rb == null) {
                throw new RuntimeException("Empty response");
            }
            List<?> choices = (List<?>) rb.get("choices");
            Map<?, ?> choice = (Map<?, ?>) choices.get(0);
            Map<?, ?> msg = (Map<?, ?>) choice.get("message");
            return msg.get("content").toString();

        } catch (Exception e) {
            log.error("Groq error: {}", e.getMessage());
            throw new RuntimeException(
                    "AI error: " + e.getMessage());
        }
    }

    private String cleanJson(String raw) {
        if (raw == null || raw.isBlank()) {
            throw new RuntimeException("Empty response");
        }
        String c = raw
                .replaceAll("(?s)```json\\s*", "")
                .replaceAll("(?s)```\\s*", "")
                .trim();
        int s = c.indexOf('{');
        int e = c.lastIndexOf('}');
        if (s != -1 && e != -1 && e > s) {
            c = c.substring(s, e + 1);
        }
        return c;
    }

    private String getMatchLabel(int score) {
        if (score >= 80)
            return "Strong Match";
        if (score >= 65)
            return "Good Match";
        if (score >= 45)
            return "Fair Match";
        if (score >= 25)
            return "Weak Match";
        return "Poor Match";
    }

    private int clamp(int v, int min, int max) {
        return Math.max(min, Math.min(max, v));
    }

    private List<String> safe(List<String> l) {
        return l != null ? l : new ArrayList<>();
    }

    // ── Inner class ──────────────────────────────────────────────
    @JsonIgnoreProperties(ignoreUnknown = true)
    @lombok.Data
    @lombok.NoArgsConstructor
    public static class RawMatchResult {
        private int matchScore;
        private String overallFeedback;
        private String recommendation;
        private List<String> matchedSkills;
        private List<String> missingSkills;
        private List<String> partialSkills;
        private List<String> matchedKeywords;
        private List<String> missingKeywords;
        private String experienceMatch;
        private String educationMatch;
        private String experienceFeedback;
        private String educationFeedback;
        private int skillsScore;
        private int keywordsScore;
        private int experienceScore;
        private int educationScore;
        private int overallFormatScore;
        private List<String> topImprovements;
        private List<String> resumeTweaks;
        private List<String> skillsToLearn;
        private String estimatedTimeToReady;
    }
}


