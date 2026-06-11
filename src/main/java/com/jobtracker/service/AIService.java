package com.jobtracker.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jobtracker.dto.request.*;
import com.jobtracker.dto.response.*;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.*;

@Service
@RequiredArgsConstructor
public class AIService {

    @Value("${gemini.api.key}")
    private String apiKey;

    @Value("${gemini.api.url}")
    private String apiUrl;

    private final ObjectMapper objectMapper = new ObjectMapper();

    // ── CALL GEMINI ──────────────────────────────────────────────
    private String callGemini(String prompt) {
                Exception lastException = null;

                for (int attempt = 0; attempt < 3; attempt++) {
                        try {
                                WebClient client = WebClient.create();

                                Map<String, Object> textPart = Map.of("text", prompt);
                                Map<String, Object> parts = Map.of("parts", List.of(textPart));
                                Map<String, Object> requestBody = Map.of("contents", List.of(parts));

                                String geminiResponse = client.post()
                                                .uri(apiUrl + "?key=" + apiKey)
                                                .header("Content-Type", "application/json")
                                                .bodyValue(requestBody)
                                                .retrieve()
                                                .onStatus(
                                                        status -> status.isError(),
                                                        clientResponse -> clientResponse.bodyToMono(String.class)
                                                                        .map(errorBody ->
                                                                                        new RuntimeException("Gemini Error: " + errorBody))
                                                )
                                                .bodyToMono(String.class)
                                                .block();

                                // Extract text from Gemini response
                                JsonNode root = objectMapper.readTree(geminiResponse);
                                return root
                                                .path("candidates").get(0)
                                                .path("content")
                                                .path("parts").get(0)
                                                .path("text")
                                                .asText();

                        } catch (Exception e) {
                                lastException = e;

                                if (attempt == 2) {
                                        break;
                                }

                                try {
                                        Thread.sleep(1000L * (attempt + 1));
                                } catch (InterruptedException interruptedException) {
                                        Thread.currentThread().interrupt();
                                        throw new RuntimeException("AI service interrupted while retrying", interruptedException);
                                }
                        }
        }

                throw new RuntimeException("AI service error: " + lastException.getMessage(), lastException);
    }

    // ── CLEAN JSON from Gemini (strips markdown code fences) ─────
    private String cleanJson(String raw) {
        return raw
                .replaceAll("(?s)```json\\s*", "")
                .replaceAll("(?s)```\\s*", "")
                .trim();
    }

    // ── RESUME ANALYSIS ──────────────────────────────────────────
    public ResumeAnalysisResponse analyzeResume(
            ResumeAnalysisRequest request) {

        String prompt = """
                You are an expert ATS resume reviewer.
                Analyze the following resume and respond ONLY with valid JSON.
                No explanation, no markdown, just raw JSON.

                Resume:
                %s

                %s

                Respond with this exact JSON structure:
                {
                  "atsScore": <number 0-100>,
                  "scoreLabel": "<Excellent|Good|Average|Needs Work>",
                  "strengths": ["<strength1>", "<strength2>"],
                  "weaknesses": ["<weakness1>", "<weakness2>"],
                  "missingKeywords": ["<keyword1>", "<keyword2>"],
                  "improvementSuggestions": ["<suggestion1>", "<suggestion2>"],
                  "overallFeedback": "<2-3 sentence summary>"
                }
                """.formatted(
                request.getResumeText(),
                request.getJobDescription() != null
                        ? "Target Job Description:\n" + request.getJobDescription()
                        : "No specific job description provided.");

        try {
            String raw = callGemini(prompt);
            String cleaned = cleanJson(raw);
            return objectMapper.readValue(cleaned,
                    ResumeAnalysisResponse.class);
        } catch (Exception e) {
            throw new RuntimeException(
                    "Failed to parse AI response: " + e.getMessage());
        }
    }

    // ── INTERVIEW QUESTIONS ───────────────────────────────────────
    public InterviewQuestionsResponse generateQuestions(
            InterviewQuestionsRequest request) {

        String prompt = """
                You are an expert technical interviewer.
                Generate interview questions for the following role and respond
                ONLY with valid JSON. No explanation, no markdown, just raw JSON.

                Job Role: %s
                Experience Level: %s
                Job Description: %s

                Respond with this exact JSON structure:
                {
                  "jobRole": "%s",
                  "technicalQuestions": [
                    {
                      "question": "<question text>",
                      "hint": "<brief answer hint>",
                      "difficulty": "<Easy|Medium|Hard>"
                    }
                  ],
                  "behaviouralQuestions": [
                    {
                      "question": "<question text>",
                      "hint": "<brief answer hint>",
                      "difficulty": "<Easy|Medium|Hard>"
                    }
                  ],
                  "hrQuestions": [
                    {
                      "question": "<question text>",
                      "hint": "<brief answer hint>",
                      "difficulty": "Easy"
                    }
                  ]
                }

                Generate %d questions total, distributed across the three categories.
                """.formatted(
                request.getJobRole() != null
                        ? request.getJobRole()
                        : "Software Engineer",
                request.getExperienceLevel() != null
                        ? request.getExperienceLevel()
                        : "Fresher",
                request.getJobDescription(),
                request.getJobRole() != null
                        ? request.getJobRole()
                        : "Software Engineer",
                request.getQuestionCount());

        try {
            String raw = callGemini(prompt);
            String cleaned = cleanJson(raw);
            return objectMapper.readValue(cleaned,
                    InterviewQuestionsResponse.class);
        } catch (Exception e) {
            throw new RuntimeException(
                    "Failed to parse AI response: " + e.getMessage());
        }
    }

    // ── SKILL GAP ANALYSIS ────────────────────────────────────────
    public SkillGapResponse analyzeSkillGap(SkillGapRequest request) {

        String prompt = """
                You are a career counselor and technical skills expert.
                Analyze the skill gap and respond ONLY with valid JSON.
                No explanation, no markdown, just raw JSON.

                Target Role: %s
                Job Description: %s
                Candidate's Current Skills: %s

                Respond with this exact JSON structure:
                {
                  "presentSkills": ["<skill1>", "<skill2>"],
                  "missingSkills": ["<skill1>", "<skill2>"],
                  "niceToHaveSkills": ["<skill1>", "<skill2>"],
                  "matchPercentage": <number 0-100>,
                  "learningPath": [
                    {
                      "skill": "<skill name>",
                      "suggestedResource": "<resource name>",
                      "estimatedTime": "<e.g. 2 weeks>"
                    }
                  ],
                  "summary": "<2-3 sentence overall assessment>"
                }
                """.formatted(
                request.getTargetRole() != null
                        ? request.getTargetRole()
                        : "Software Engineer",
                request.getJobDescription(),
                request.getCurrentSkills());

        try {
            String raw = callGemini(prompt);
            String cleaned = cleanJson(raw);
            return objectMapper.readValue(cleaned, SkillGapResponse.class);
        } catch (Exception e) {
            throw new RuntimeException(
                    "Failed to parse AI response: " + e.getMessage());
        }
    }

    // ── PLACEMENT PREPARATION ─────────────────────────────────────
    public String getPlacementPrep(String jobDescription, String targetRole) {

        String prompt = """
                You are a placement preparation expert for engineering students.
                Give a comprehensive placement preparation guide for the following.

                Target Role: %s
                Job Description: %s

                Cover these sections:
                1. Key topics to study
                2. DSA topics to focus on
                3. System design topics (if applicable)
                4. Projects to build
                5. Timeline (week-by-week for 4 weeks)
                6. Resources (free + paid)
                7. Mock interview tips

                Be specific and actionable. Format as clean readable text.
                """.formatted(targetRole, jobDescription);

        return callGemini(prompt);
    }
}