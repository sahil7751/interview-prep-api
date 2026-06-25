package com.jobtracker.service;

import com.jobtracker.dto.request.CareerCoachRequest;
import com.jobtracker.dto.request.CareerCoachRequest.ChatMessage;
import com.jobtracker.dto.response.CareerCoachResponse;
import com.jobtracker.entity.User;
import com.jobtracker.repository.UserProfileRepository;
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

    @Value("${groq.api.key:}")
    private String groqApiKey;

    @Value("${groq.api.url:https://api.groq.com/openai/v1/chat/completions}")
    private String groqApiUrl;

    @Value("${groq.api.model:llama-3.3-70b-versatile}")
    private String groqModel;

    private static final String SYSTEM_PROMPT = """
            You are an expert AI Career Coach specializing in helping
            engineering students and software developers with:

            1. PLACEMENT PREPARATION
               - Company-specific preparation (TCS, Infosys, Wipro,
                 Google, Amazon, Microsoft, Flipkart, etc.)
               - Resume building and optimization
               - Online assessments and aptitude tests
               - Interview preparation strategies

            2. DATA STRUCTURES & ALGORITHMS (DSA)
               - Topic-wise guidance (Arrays, LinkedList, Trees,
                 Graphs, DP, etc.)
               - LeetCode/HackerRank problem recommendations
               - Time and space complexity analysis
               - Approaching new problems

            3. TECHNICAL INTERVIEWS
               - System design concepts
               - Java/Python/JavaScript interview questions
               - Behavioral interview answers (STAR method)
               - Common interview patterns

            4. CAREER PLANNING
               - Career path guidance
               - Skill gap identification
               - Learning roadmaps
               - Salary negotiation tips
               - Job search strategies

            5. RESUME & PROFILE
               - ATS optimization
               - Project descriptions
               - Skills to highlight
               - LinkedIn profile tips

            COACHING STYLE:
            - Be encouraging, specific, and actionable
            - Give concrete examples, not vague advice
            - When asked about DSA, provide actual problem names
            - When asked about companies, give company-specific info
            - Keep responses focused and structured
            - Use bullet points for lists, but be conversational
            - If user shares their skills/background, personalize advice
            - Ask clarifying questions when needed
            - Celebrate progress and keep motivation high

            You are talking to an engineering student in India
            preparing for placements. Be aware of the Indian tech
            job market, package expectations, and placement season.
            """;

    // ── CHAT ─────────────────────────────────────────────────────
    public CareerCoachResponse chat(CareerCoachRequest request) {
        User user = securityUtils.getCurrentUser();

        // Build personalized context
        String userContext = buildUserContext(user,
                request.getContext());

        // Build messages for Groq
        List<Map<String, String>> messages = new ArrayList<>();

        // System message with persona + user context
        messages.add(Map.of(
                "role", "system",
                "content", SYSTEM_PROMPT + userContext));

        // Add conversation history (last 20 messages max)
        List<ChatMessage> history = request.getMessages();
        int start = Math.max(0, history.size() - 20);
        for (int i = start; i < history.size(); i++) {
            ChatMessage msg = history.get(i);
            if (msg.getRole() != null
                    && msg.getContent() != null
                    && !msg.getContent().isBlank()) {
                messages.add(Map.of(
                        "role", msg.getRole(),
                        "content", msg.getContent()));
            }
        }

        log.info("Career coach chat: {} messages for {}",
                messages.size(), user.getEmail());

        String response = callGroq(messages);

        return CareerCoachResponse.builder()
                .message(response)
                .role("assistant")
                .build();
    }

    // ── BUILD USER CONTEXT ────────────────────────────────────────
    private String buildUserContext(User user, String extra) {
        StringBuilder ctx = new StringBuilder(
                "\n\nUSER CONTEXT:\n");
        ctx.append("Name: ").append(user.getName()).append("\n");

        profileRepository.findByUser(user).ifPresent(p -> {
            if (p.getCollegeName() != null) {
                ctx.append("College: ")
                        .append(p.getCollegeName()).append("\n");
            }
            if (p.getDegree() != null) {
                ctx.append("Degree: ")
                        .append(p.getDegree()).append(" in ")
                        .append(p.getBranch() != null
                                ? p.getBranch()
                                : "")
                        .append("\n");
            }
            if (p.getGraduationYear() != null) {
                ctx.append("Graduation Year: ")
                        .append(p.getGraduationYear()).append("\n");
            }
            if (p.getSkills() != null && !p.getSkills().isBlank()) {
                ctx.append("Known Skills: ")
                        .append(p.getSkills()).append("\n");
            }
            if (p.getCurrentRole() != null) {
                ctx.append("Current Role: ")
                        .append(p.getCurrentRole()).append("\n");
            }
        });

        if (extra != null && !extra.isBlank()) {
            ctx.append("Additional Context: ")
                    .append(extra).append("\n");
        }

        ctx.append("Tailor all advice to this user's background.");
        return ctx.toString();
    }

    // ── GROQ CALL ────────────────────────────────────────────────
    private String callGroq(List<Map<String, String>> messages) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(groqApiKey);

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("model", groqModel);
        body.put("messages", messages);
        body.put("temperature", 0.7); // more conversational
        body.put("max_tokens", 1024);

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

            // Get token usage
            Map<?, ?> usage = (Map<?, ?>) rb.get("usage");
            int tokens = usage != null
                    ? ((Number) usage.getOrDefault(
                            "total_tokens", 0)).intValue()
                    : 0;

            log.info("Career coach response: {} tokens", tokens);
            return msg.get("content").toString();

        } catch (Exception e) {
            log.error("Groq error: {}", e.getMessage());
            throw new RuntimeException(
                    "AI service error: " + e.getMessage());
        }
    }
}

