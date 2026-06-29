package com.jobtracker.service;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jobtracker.dto.request.EvaluateAnswerRequest;
import com.jobtracker.dto.request.StartSessionRequest;
import com.jobtracker.dto.response.*;
import com.jobtracker.entity.*;
import com.jobtracker.repository.*;
import com.jobtracker.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class InterviewEvalService {

    private final InterviewPracticeSessionRepository sessionRepository;
    private final InterviewQaRecordRepository qaRepository;
    private final SecurityUtils securityUtils;
    private final GamificationService gamificationService;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${groq.api.key:}")
    private String groqApiKey;

    @Value("${groq.api.url:https://api.groq.com/openai/v1/chat/completions}")
    private String groqApiUrl;

    @Value("${groq.api.model:llama-3.3-70b-versatile}")
    private String groqModel;

    // ── START SESSION ────────────────────────────────────────────
    @Transactional
    public PracticeSessionResponse startSession(
                    StartSessionRequest request) {

            User user = securityUtils.getCurrentUser();

            // Award XP for starting interview
            gamificationService.recordActivity(user,
                            XpAction.GENERATE_QUESTIONS);

            // Build enhanced session
            InterviewPracticeSession session = InterviewPracticeSession.builder()
                            .user(user)
                            .jobRole(request.getJobRole())
                            .jobDescription(request.getJobDescription())
                            .experienceLevel(request.getExperienceLevel())
                            .totalQuestions(request.getQuestionCount())
                            .build();

            session = sessionRepository.save(session);

            // Generate questions with enhanced prompt
            List<GeneratedQuestion> questions = generateEnhancedQuestions(request);

            List<PracticeQuestionResponse> questionResponses = new ArrayList<>();

            for (GeneratedQuestion q : questions) {
                    InterviewQaRecord record = InterviewQaRecord.builder()
                                    .session(session)
                                    .user(user)
                                    .question(q.question)
                                    .difficulty(q.difficulty)
                                    .category(q.category)
                                    .build();

                    InterviewQaRecord saved = qaRepository.save(record);

                    questionResponses.add(
                                    PracticeQuestionResponse.builder()
                                                    .id(saved.getId())
                                                    .question(saved.getQuestion())
                                                    .difficulty(saved.getDifficulty())
                                                    .category(saved.getCategory())
                                                    .evaluated(false)
                                                    .build());
            }

            session.setTotalQuestions(questionResponses.size());
            sessionRepository.save(session);

            return PracticeSessionResponse.builder()
                            .id(session.getId())
                            .jobRole(session.getJobRole())
                            .jobDescription(session.getJobDescription())
                            .experienceLevel(session.getExperienceLevel())
                            .interviewType(request.getInterviewType())
                            .difficulty(request.getDifficulty())
                            .targetCompany(request.getTargetCompany())
                            .totalQuestions(session.getTotalQuestions())
                            .answeredQuestions(0)
                            .averageScore(0.0)
                            .timedMode(request.isTimedMode())
                            .timeLimitMinutes(request.getTimeLimitMinutes())
                            .createdAt(session.getCreatedAt())
                            .questions(questionResponses)
                            .build();
    }

    // Enhanced question generation with company + type context
    private List<GeneratedQuestion> generateEnhancedQuestions(
                    StartSessionRequest request) {

            String skillsStr = request.getSelectedSkills() != null
                            ? String.join(", ", request.getSelectedSkills())
                            : "General";

            String prompt = """
                            You are an expert interviewer at %s.
                            Generate exactly %d interview questions.

                            Role: %s
                            Interview Type: %s
                            Difficulty: %s
                            Skills Focus: %s
                            Experience: %s
                            Job Description: %s

                            Return ONLY a valid JSON array, no markdown:
                            [
                              {
                                "question": "<specific question text>",
                                "difficulty": "<Easy|Medium|Hard>",
                                "category": "<Technical|Behavioural|HR|System Design>"
                              }
                            ]

                            Distribution based on type:
                            - Technical: 70%% Technical, 20%% Behavioural, 10%% HR
                            - HR: 20%% Technical, 30%% Behavioural, 50%% HR
                            - Behavioral: 20%% Technical, 60%% Behavioural, 20%% HR
                            - System Design: 60%% System Design, 30%% Technical, 10%% HR
                            - Mixed: 50%% Technical, 25%% Behavioural, 15%% HR, 10%% System Design

                            Make questions specific to %s company culture and role.
                            For difficulty %s, adjust question complexity accordingly.
                            """.formatted(
                            request.getTargetCompany() != null
                                            ? request.getTargetCompany()
                                            : "a top tech company",
                            request.getQuestionCount(),
                            request.getJobRole(),
                            request.getInterviewType(),
                            request.getDifficulty(),
                            skillsStr,
                            request.getExperienceLevel(),
                            request.getJobDescription().length() > 500
                                            ? request.getJobDescription().substring(0, 500)
                                            : request.getJobDescription(),
                            request.getTargetCompany() != null
                                            ? request.getTargetCompany()
                                            : "the target",
                            request.getDifficulty());

            try {
                    String raw = callGroq(prompt);
                    String cleaned = cleanJson(raw);
                    int s = cleaned.indexOf('[');
                    int e = cleaned.lastIndexOf(']');
                    if (s != -1 && e != -1)
                            cleaned = cleaned.substring(s, e + 1);
                    GeneratedQuestion[] arr = objectMapper.readValue(cleaned,
                                    GeneratedQuestion[].class);
                    return Arrays.asList(arr);
            } catch (Exception ex) {
                    log.error("Question generation failed: {}", ex.getMessage());
                    return buildFallbackQuestions(request);
            }
    }

    private List<GeneratedQuestion> buildFallbackQuestions(
                    StartSessionRequest req) {
            List<GeneratedQuestion> list = new ArrayList<>();
            String[][] defaults = {
                            { "Tell me about yourself and your background.", "Easy", "HR" },
                            { "Explain your most challenging technical project.", "Medium", "Technical" },
                            { "How do you approach problem solving under pressure?", "Medium", "Behavioural" },
                            { "What is your experience with " + req.getJobRole() + "?", "Medium", "Technical" },
                            { "Where do you see yourself in 5 years?", "Easy", "HR" },
            };
            int count = Math.min(req.getQuestionCount(), defaults.length);
            for (int i = 0; i < count; i++) {
                    list.add(new GeneratedQuestion(
                                    defaults[i][0], defaults[i][1], defaults[i][2]));
            }
            return list;
    }

    
    // ── EVALUATE ANSWER ──────────────────────────────────────────
    @Transactional
    public EvaluationResponse evaluateAnswer(
            EvaluateAnswerRequest request) {

        User user = securityUtils.getCurrentUser();

        InterviewQaRecord record = qaRepository
                .findByIdAndUser(request.getQuestionId(), user)
                .orElseThrow(() -> new RuntimeException("Question not found"));

        if (Boolean.TRUE.equals(record.getIsEvaluated())) {
            // Return existing evaluation
            return buildEvalResponse(record, 0,
                    gamificationService.getStats().getTotalXp());
        }

        // Call AI for evaluation
        EvalResult eval = evaluateWithAI(
                record.getQuestion(),
                request.getUserAnswer(),
                record.getCategory(),
                record.getDifficulty());

        // Save evaluation
        record.setUserAnswer(request.getUserAnswer());
        record.setAiScore(eval.score);
        record.setStrengths(toJson(eval.strengths));
        record.setWeaknesses(toJson(eval.weaknesses));
        record.setImprovementSuggestions(
                toJson(eval.improvementSuggestions));
        record.setIdealAnswer(eval.idealAnswer);
        record.setIsEvaluated(true);
        record.setEvaluatedAt(LocalDateTime.now());
        qaRepository.save(record);

        // Update session stats
        updateSessionStats(record.getSession());

        // Award XP
        gamificationService.awardXp(user,
                XpAction.ANSWER_QUESTION);
        int totalXp = gamificationService.getStats().getTotalXp();

        log.info("Answer evaluated: score={} for user={}",
                eval.score, user.getEmail());

        return EvaluationResponse.builder()
                .questionId(record.getId())
                .question(record.getQuestion())
                .userAnswer(request.getUserAnswer())
                .category(record.getCategory())
                .difficulty(record.getDifficulty())
                .score(eval.score)
                .scoreLabel(getScoreLabel(eval.score))
                .strengths(eval.strengths)
                .weaknesses(eval.weaknesses)
                .improvementSuggestions(eval.improvementSuggestions)
                .idealAnswer(eval.idealAnswer)
                .overallFeedback(eval.overallFeedback)
                .xpEarned(XpAction.ANSWER_QUESTION.getXpPoints())
                .totalXp(totalXp)
                .build();
    }

    // ── GET SESSION ──────────────────────────────────────────────
    public PracticeSessionResponse getSession(Long sessionId) {
        User user = securityUtils.getCurrentUser();

        InterviewPracticeSession session = sessionRepository
                .findByIdAndUser(sessionId, user)
                .orElseThrow(() -> new RuntimeException("Session not found"));

        List<PracticeQuestionResponse> questions = qaRepository.findBySessionOrderByCreatedAtAsc(session)
                .stream()
                .map(r -> PracticeQuestionResponse.builder()
                        .id(r.getId())
                        .question(r.getQuestion())
                        .difficulty(r.getDifficulty())
                        .category(r.getCategory())
                        .evaluated(
                                Boolean.TRUE.equals(r.getIsEvaluated()))
                        .score(r.getAiScore())
                        .build())
                .toList();

        return PracticeSessionResponse.builder()
                .id(session.getId())
                .jobRole(session.getJobRole())
                .experienceLevel(session.getExperienceLevel())
                .totalQuestions(session.getTotalQuestions())
                .answeredQuestions(session.getAnsweredQuestions())
                .averageScore(session.getAverageScore())
                .createdAt(session.getCreatedAt())
                .questions(questions)
                .build();
    }

    // ── GET ALL SESSIONS ─────────────────────────────────────────
    public PagedResponse<PracticeSessionResponse> getAllSessions(
            int page, int size) {

        User user = securityUtils.getCurrentUser();
        Page<InterviewPracticeSession> result = sessionRepository.findByUserOrderByCreatedAtDesc(
                user, PageRequest.of(page, size));

        List<PracticeSessionResponse> content = result.getContent()
                .stream()
                .map(s -> PracticeSessionResponse.builder()
                        .id(s.getId())
                        .jobRole(s.getJobRole())
                        .experienceLevel(s.getExperienceLevel())
                        .totalQuestions(s.getTotalQuestions())
                        .answeredQuestions(s.getAnsweredQuestions())
                        .averageScore(s.getAverageScore())
                        .createdAt(s.getCreatedAt())
                        .build())
                .toList();

        return PagedResponse.<PracticeSessionResponse>builder()
                .content(content)
                .page(result.getNumber())
                .size(result.getSize())
                .totalElements(result.getTotalElements())
                .totalPages(result.getTotalPages())
                .last(result.isLast())
                .build();
    }

    // ── GET IDEAL ANSWER (without submitting) ────────────────────
    public String getIdealAnswer(Long questionId) {
        User user = securityUtils.getCurrentUser();

        InterviewQaRecord record = qaRepository
                .findByIdAndUser(questionId, user)
                .orElseThrow(() -> new RuntimeException("Question not found"));

        if (record.getIdealAnswer() != null) {
            return record.getIdealAnswer();
        }

        // Generate ideal answer via AI
        String ideal = generateIdealAnswer(
                record.getQuestion(),
                record.getCategory());

        record.setIdealAnswer(ideal);
        qaRepository.save(record);

        return ideal;
    }

    // ── AI: GENERATE QUESTIONS ───────────────────────────────────
    private List<GeneratedQuestion> generateQuestions(
            StartSessionRequest request) {

        String prompt = """
                Generate exactly %d interview questions for:
                Role: %s
                Experience: %s
                JD: %s

                Respond ONLY with valid JSON array, no markdown:
                [
                  {
                    "question": "<question text>",
                    "difficulty": "<Easy|Medium|Hard>",
                    "category": "<Technical|Behavioural|HR>"
                  }
                ]
                Mix categories: 60%% Technical, 25%% Behavioural, 15%% HR.
                """.formatted(
                request.getQuestionCount(),
                request.getJobRole(),
                request.getExperienceLevel(),
                request.getJobDescription());

        try {
            String raw = callGroq(prompt);
            String cleaned = cleanJson(raw);
            GeneratedQuestion[] arr = objectMapper.readValue(
                    cleaned, GeneratedQuestion[].class);
            return Arrays.asList(arr);
        } catch (Exception e) {
            log.error("Failed to generate questions: {}",
                    e.getMessage());
            // Fallback questions
            return List.of(
                    new GeneratedQuestion(
                            "Explain the concept of OOP with examples.",
                            "Medium", "Technical"),
                    new GeneratedQuestion(
                            "Tell me about yourself.",
                            "Easy", "HR"),
                    new GeneratedQuestion(
                            "Describe a challenging project you worked on.",
                            "Medium", "Behavioural"));
        }
    }

    // ── AI: EVALUATE ANSWER ──────────────────────────────────────
    private EvalResult evaluateWithAI(String question,
            String userAnswer,
            String category,
            String difficulty) {
            String prompt = """
                            You are an expert technical interviewer evaluating a candidate's answer.

                            Question: %s
                            Category: %s
                            Difficulty: %s
                            Candidate's Answer: %s

                            Evaluate the answer and respond ONLY with valid JSON, no markdown:
                            {
                              "score": <number 0.0-10.0>,
                              "strengths": ["<point1>", "<point2>"],
                              "weaknesses": ["<point1>", "<point2>"],
                              "improvementSuggestions": ["<suggestion1>", "<suggestion2>"],
                              "idealAnswer": "<comprehensive ideal answer>",
                              "overallFeedback": "<2-3 sentence overall assessment>"
                            }

                            Scoring guide:
                            9-10: Excellent — complete, accurate, well-explained
                            7-8:  Good — mostly correct with minor gaps
                            5-6:  Average — partially correct, key concepts missing
                            3-4:  Below average — significant gaps
                            0-2:  Poor — incorrect or no meaningful answer

                            If the answer is empty or "skip", give score 0 and explain what was expected.
                            """.formatted(question, category, difficulty, userAnswer);
        try {
            String raw = callGroq(prompt);

            // ── ADD THIS DEBUG LOG ──────────────────────────────
            log.info("=== GROQ RAW RESPONSE ===");
            log.info(raw);
            log.info("=========================");
            // ───────────────────────────────────────────────────

            String cleaned = cleanJson(raw);

            log.info("=== CLEANED JSON ===");
            log.info(cleaned);
            log.info("====================");

            return objectMapper.readValue(cleaned, EvalResult.class);
        } catch (Exception e) {
            log.error("Evaluation parse failed: {}", e.getMessage());
            return new EvalResult(
                    0.0,
                    List.of(),
                    List.of("Could not evaluate answer"),
                    List.of("Please try again"),
                    "Unable to generate ideal answer at this time.",
                    "Evaluation failed. Please try again.");
        }
    }

    // ── AI: IDEAL ANSWER ─────────────────────────────────────────
    private String generateIdealAnswer(String question,
            String category) {
        String prompt = """
                Provide a comprehensive ideal interview answer for:
                Question: %s
                Category: %s

                Give a clear, structured, interview-ready answer.
                Be specific and practical. 150-250 words.
                """.formatted(question, category);

        try {
            return callGroq(prompt);
        } catch (Exception e) {
            return "Unable to generate ideal answer. Please try again.";
        }
    }

    // ── CALL GROQ ────────────────────────────────────────────────
    private String callGroq(String prompt) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(groqApiKey);

        Map<String, Object> message = Map.of(
                "role", "user",
                "content", prompt);

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("model", groqModel);
        body.put("messages", List.of(message));
        body.put("temperature", 0.3);
        body.put("max_tokens", 2048);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<Map> response = restTemplate.exchange(
                    groqApiUrl, HttpMethod.POST,
                    entity, Map.class);

            Map<?, ?> responseBody = response.getBody();
            if (responseBody == null) {
                throw new RuntimeException("Empty response from Groq");
            }

            List<?> choices = (List<?>) responseBody.get("choices");
            Map<?, ?> choice = (Map<?, ?>) choices.get(0);
            Map<?, ?> msg = (Map<?, ?>) choice.get("message");
            return msg.get("content").toString();

        } catch (Exception e) {
            log.error("Groq API error: {}", e.getMessage());
            throw new RuntimeException(
                    "AI service error: " + e.getMessage());
        }
    }

    // ── HELPERS ──────────────────────────────────────────────────

    private String cleanJson(String raw) {
        if (raw == null || raw.isBlank()) {
            throw new RuntimeException("Empty response from AI");
        }

        String cleaned = raw
                .replaceAll("(?s)```json\\s*", "")
                .replaceAll("(?s)```\\s*", "")
                .trim();

        // Find the first { and last } to extract just the JSON
        int start = cleaned.indexOf('{');
        int end = cleaned.lastIndexOf('}');

        if (start != -1 && end != -1 && end > start) {
            cleaned = cleaned.substring(start, end + 1);
        }

        return cleaned;
    }

    private String getScoreLabel(double score) {
        if (score >= 9)
            return "Excellent";
        if (score >= 7)
            return "Good";
        if (score >= 5)
            return "Average";
        if (score >= 3)
            return "Below Average";
        return "Needs Improvement";
    }

    private void updateSessionStats(
            InterviewPracticeSession session) {

        List<InterviewQaRecord> evaluated = qaRepository.findBySessionOrderByCreatedAtAsc(session)
                .stream()
                .filter(r -> Boolean.TRUE.equals(r.getIsEvaluated()))
                .toList();

        int answered = evaluated.size();
        double avg = evaluated.stream()
                .mapToDouble(InterviewQaRecord::getAiScore)
                .average()
                .orElse(0.0);

        session.setAnsweredQuestions(answered);
        session.setAverageScore(
                Math.round(avg * 10.0) / 10.0);
        sessionRepository.save(session);
    }

    private String toJson(List<String> list) {
        try {
            return objectMapper.writeValueAsString(list);
        } catch (Exception e) {
            return "[]";
        }
    }

    private List<String> fromJson(String json) {
        try {
            if (json == null || json.isBlank())
                return List.of();
            String[] arr = objectMapper.readValue(json,
                    String[].class);
            return Arrays.asList(arr);
        } catch (Exception e) {
            return List.of(json);
        }
    }

    private EvaluationResponse buildEvalResponse(
            InterviewQaRecord record,
            int xpEarned, int totalXp) {
        return EvaluationResponse.builder()
                .questionId(record.getId())
                .question(record.getQuestion())
                .userAnswer(record.getUserAnswer())
                .category(record.getCategory())
                .difficulty(record.getDifficulty())
                .score(record.getAiScore() != null
                        ? record.getAiScore()
                        : 0.0)
                .scoreLabel(getScoreLabel(
                        record.getAiScore() != null
                                ? record.getAiScore()
                                : 0.0))
                .strengths(fromJson(record.getStrengths()))
                .weaknesses(fromJson(record.getWeaknesses()))
                .improvementSuggestions(fromJson(
                        record.getImprovementSuggestions()))
                .idealAnswer(record.getIdealAnswer())
                .xpEarned(xpEarned)
                .totalXp(totalXp)
                .build();
    }

    // ── Inner classes for JSON mapping ───────────────────────────

    @lombok.Data
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class GeneratedQuestion {
        private String question;
        private String difficulty;
        private String category;
    }

    @lombok.Data
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)  // ← add this
    public static class EvalResult {
        private double       score;
        private List<String> strengths;
        private List<String> weaknesses;
        private List<String> improvementSuggestions;
        private String       idealAnswer;
        private String       overallFeedback;
    }
}

