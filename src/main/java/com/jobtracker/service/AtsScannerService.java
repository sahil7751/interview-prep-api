package com.jobtracker.service;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jobtracker.dto.request.AtsScanTextRequest;
import com.jobtracker.dto.response.AtsScanResponse;
import com.jobtracker.dto.response.AtsScanResponse.SectionScore;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.apache.pdfbox.io.RandomAccessReadBuffer;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;
import org.apache.pdfbox.io.RandomAccessReadBuffer;
import org.apache.pdfbox.Loader;


import java.io.IOException;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class AtsScannerService {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${groq.api.key:}")
    private String groqApiKey;

    @Value("${groq.api.url:https://api.groq.com/openai/v1/chat/completions}")
    private String groqApiUrl;

    @Value("${groq.api.model:llama-3.3-70b-versatile}")
    private String groqModel;

    // ── SCAN FROM PDF FILE ───────────────────────────────────────
    public AtsScanResponse scanPdf(MultipartFile file,
            String jobDescription)
            throws IOException {

        // Validate file
        if (file.isEmpty()) {
            throw new RuntimeException("File is empty");
        }
        String originalName = file.getOriginalFilename();
        if (originalName == null
                || !originalName.toLowerCase().endsWith(".pdf")) {
            throw new RuntimeException("Only PDF files accepted");
        }
        if (file.getSize() > 5 * 1024 * 1024) {
            throw new RuntimeException("File must be under 5 MB");
        }

        // Extract text from PDF
        String resumeText = extractTextFromPdf(file);

        if (resumeText == null || resumeText.isBlank()) {
            throw new RuntimeException(
                    "Could not extract text from PDF. "
                            + "Please ensure it is not a scanned image.");
        }

        log.info("Extracted {} characters from PDF",
                resumeText.length());

        return analyzeResume(resumeText, jobDescription);
    }

    // ── SCAN FROM TEXT ───────────────────────────────────────────
    public AtsScanResponse scanText(AtsScanTextRequest request) {
        return analyzeResume(request.getResumeText(),
                request.getJobDescription());
    }

    // ── CORE ANALYSIS ────────────────────────────────────────────
    private AtsScanResponse analyzeResume(String resumeText,
            String jobDescription) {

        int wordCount = resumeText.split("\\s+").length;

        String prompt = buildPrompt(resumeText, jobDescription);

        try {
            String raw = callGroq(prompt);
            String cleaned = cleanJson(raw);

            log.info("ATS scan response received");

            AtsRawResult raw2 = objectMapper.readValue(
                    cleaned, AtsRawResult.class);

            return AtsScanResponse.builder()
                    .atsScore(clamp(raw2.atsScore, 0, 100))
                    .scoreLabel(getScoreLabel(raw2.atsScore))
                    .overallFeedback(raw2.overallFeedback)
                    .foundKeywords(safe(raw2.foundKeywords))
                    .missingKeywords(safe(raw2.missingKeywords))
                    .suggestedKeywords(safe(raw2.suggestedKeywords))
                    .sectionScores(safeSections(
                            raw2.sectionScores))
                    .formattingIssues(safe(raw2.formattingIssues))
                    .formattingStrengths(
                            safe(raw2.formattingStrengths))
                    .improvementSuggestions(
                            safe(raw2.improvementSuggestions))
                    .quickWins(safe(raw2.quickWins))
                    .wordCount(wordCount)
                    .keywordMatchPercent(
                            clamp(raw2.keywordMatchPercent, 0, 100))
                    .build();

        } catch (Exception e) {
            log.error("ATS scan parse failed: {}", e.getMessage());
            throw new RuntimeException(
                    "ATS analysis failed: " + e.getMessage());
        }
    }

    // ── BUILD PROMPT ─────────────────────────────────────────────
    private String buildPrompt(String resumeText,
            String jobDescription) {
        String jdSection = (jobDescription != null
                && !jobDescription.isBlank())
                        ? "Target Job Description:\n" + jobDescription
                        : "No specific job description provided — "
                                + "do a general ATS analysis.";

        return """
                You are an expert ATS (Applicant Tracking System) analyzer.
                Analyze this resume and provide a detailed ATS assessment.
                Return ONLY valid JSON, no markdown, no extra text.

                Resume Text:
                %s

                %s

                Return this exact JSON structure:
                {
                  "atsScore": <integer 0-100>,
                  "overallFeedback": "<2-3 sentence overall assessment>",
                  "foundKeywords": ["<keyword found in resume>"],
                  "missingKeywords": ["<important keyword missing>"],
                  "suggestedKeywords": ["<keyword to add for ATS>"],
                  "sectionScores": [
                    {
                      "section": "<Contact|Summary|Skills|Experience|Education|Projects>",
                      "score": <0-100>,
                      "feedback": "<specific feedback>",
                      "status": "<present|missing|weak>"
                    }
                  ],
                  "formattingIssues": ["<formatting problem found>"],
                  "formattingStrengths": ["<good formatting practice>"],
                  "improvementSuggestions": ["<specific improvement>"],
                  "quickWins": ["<easy fix with big impact>"],
                  "keywordMatchPercent": <integer 0-100>
                }

                Scoring criteria:
                - Contact info present and complete: 10 points
                - Professional summary: 10 points
                - Skills section with relevant keywords: 25 points
                - Experience with action verbs and metrics: 25 points
                - Education section: 10 points
                - Projects section: 10 points
                - Overall formatting and ATS-friendliness: 10 points

                Be specific and actionable in all feedback.
                If job description is provided, focus keyword analysis on it.
                """.formatted(
                resumeText.length() > 3000
                        ? resumeText.substring(0, 3000)
                        : resumeText,
                jdSection);
    }

    // ── EXTRACT TEXT FROM PDF ────────────────────────────────────
    private String extractTextFromPdf(MultipartFile file)
            throws IOException {
        try (PDDocument document = Loader.loadPDF(
                new RandomAccessReadBuffer(file.getInputStream()))) {
            PDFTextStripper stripper = new PDFTextStripper();
            stripper.setSortByPosition(true);
            return stripper.getText(document);
        }
    }

    // ── CALL GROQ ────────────────────────────────────────────────
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

            Map<?, ?> responseBody = response.getBody();
            if (responseBody == null) {
                throw new RuntimeException("Empty response");
            }
            List<?> choices = (List<?>) responseBody.get("choices");
            Map<?, ?> choice = (Map<?, ?>) choices.get(0);
            Map<?, ?> msg = (Map<?, ?>) choice.get("message");
            return msg.get("content").toString();

        } catch (Exception e) {
            log.error("Groq API error: {}", e.getMessage());
            throw new RuntimeException(
                    "AI error: " + e.getMessage());
        }
    }

    // ── HELPERS ──────────────────────────────────────────────────
    private String cleanJson(String raw) {
        if (raw == null || raw.isBlank()) {
            throw new RuntimeException("Empty AI response");
        }
        String cleaned = raw
                .replaceAll("(?s)```json\\s*", "")
                .replaceAll("(?s)```\\s*", "")
                .trim();
        int start = cleaned.indexOf('{');
        int end = cleaned.lastIndexOf('}');
        if (start != -1 && end != -1 && end > start) {
            cleaned = cleaned.substring(start, end + 1);
        }
        return cleaned;
    }

    private String getScoreLabel(int score) {
        if (score >= 85)
            return "Excellent";
        if (score >= 70)
            return "Good";
        if (score >= 50)
            return "Average";
        if (score >= 30)
            return "Needs Work";
        return "Poor";
    }

    private int clamp(int val, int min, int max) {
        return Math.max(min, Math.min(max, val));
    }

    private List<String> safe(List<String> list) {
        return list != null ? list : new ArrayList<>();
    }

    private List<SectionScore> safeSections(
            List<AtsRawResult.RawSection> sections) {
        if (sections == null)
            return new ArrayList<>();
        return sections.stream()
                .map(s -> SectionScore.builder()
                        .section(s.section)
                        .score(clamp(s.score, 0, 100))
                        .feedback(s.feedback)
                        .status(s.status)
                        .build())
                .toList();
    }

    // ── Inner class for JSON mapping ─────────────────────────────
    @JsonIgnoreProperties(ignoreUnknown = true)
    @lombok.Data
    @lombok.NoArgsConstructor
    public static class AtsRawResult {
        private int atsScore;
        private String overallFeedback;
        private List<String> foundKeywords;
        private List<String> missingKeywords;
        private List<String> suggestedKeywords;
        private List<RawSection> sectionScores;
        private List<String> formattingIssues;
        private List<String> formattingStrengths;
        private List<String> improvementSuggestions;
        private List<String> quickWins;
        private int keywordMatchPercent;

        @JsonIgnoreProperties(ignoreUnknown = true)
        @lombok.Data
        @lombok.NoArgsConstructor
        public static class RawSection {
            private String section;
            private int score;
            private String feedback;
            private String status;
        }
    }
}


