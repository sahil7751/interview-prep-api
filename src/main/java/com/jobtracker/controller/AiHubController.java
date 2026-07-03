package com.jobtracker.controller;

import com.jobtracker.dto.request.AiHubRequest;
import com.jobtracker.dto.response.*;
import com.jobtracker.entity.*;
import com.jobtracker.repository.*;
import com.jobtracker.security.SecurityUtils;
import com.jobtracker.service.*;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.io.RandomAccessReadBuffer;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@RestController
@RequestMapping("/api/v1/ai-hub")
@RequiredArgsConstructor
@Tag(name = "AI Hub", description = "CareerPilot AI unified hub")
@Slf4j
public class AiHubController {

    private final SecurityUtils         securityUtils;
    private final UserProfileRepository profileRepository;
    private final ResumeRepository      resumeRepository;
    private final FileStorageService    fileStorageService;
    private final GamificationService   gamificationService;
    private final AIService             aiService;
    private final CareerCoachService    careerCoachService;
    private final AtsScannerService     atsScannerService;
    private final RestTemplate          restTemplate;

    private final com.fasterxml.jackson.databind.ObjectMapper
            objectMapper =
            new com.fasterxml.jackson.databind.ObjectMapper();

    @Value("${groq.api.key:}")
    private String groqApiKey;

    @Value("${groq.api.url:https://api.groq.com/openai/v1/chat/completions}")
    private String groqApiUrl;

    @Value("${groq.api.model:llama-3.3-70b-versatile}")
    private String groqModel;

    // ── Context Endpoint ─────────────────────────────────────────
    @GetMapping("/context")
    public ResponseEntity<ApiResponse<Map<String, Object>>>
            getContext() {

        User user = securityUtils.getCurrentUser();
        Map<String, Object> ctx = new LinkedHashMap<>();

        ctx.put("userName", user.getName());

        profileRepository.findByUser(user).ifPresent(p -> {
            ctx.put("skills", p.getSkills());
            ctx.put("targetRole", p.getTargetRoleGoal());
            ctx.put("location", p.getLocation());
            ctx.put("college", p.getCollegeName());
            ctx.put("degree", p.getDegree());
            ctx.put("graduationYear", p.getGraduationYear());
            ctx.put("preferredCompanies", p.getPreferredCompanies());
            ctx.put("currentRole", p.getCurrentRole());
        });

        resumeRepository.findByUserAndIsActiveTrue(user)
                .ifPresent(r -> {
                    ctx.put("activeResumeLabel", r.getLabel());
                    ctx.put("activeResumeVersion", r.getVersionNumber());
                    ctx.put("activeResumeAtsScore", r.getAtsScore());
                    ctx.put("activeResumeId", r.getId());
                });

        return ResponseEntity.ok(
                ApiResponse.success("Context loaded", ctx));
    }

    // ── Company Preparation ──────────────────────────────────────
    @PostMapping("/company-prep")
    public ResponseEntity<ApiResponse<AiHubResponse>>
            companyPrep(@RequestBody AiHubRequest request) {

        User user = securityUtils.getCurrentUser();

        String company = request.getTargetCompany() != null
                ? request.getTargetCompany() : "Google";

        String userCtx = buildUserContext(user);

        String prompt = """
            You are an expert interview coach at %s.
            Generate a comprehensive company interview preparation guide.
            Return ONLY valid JSON, no markdown.
            
            %s
            
            {
              "company": "%s",
              "hiringProcess": "<describe typical hiring process>",
              "salaryRange": "<salary range for fresher/2yr>",
              "interviewPattern": "<describe rounds>",
              "frequentQuestions": ["<q1>","<q2>","<q3>","<q4>","<q5>"],
              "dsaTopics": ["<topic1>","<topic2>","<topic3>","<topic4>"],
              "behavioralQuestions": ["<q1>","<q2>","<q3>"],
              "preparationStrategy": ["<step1>","<step2>","<step3>","<step4>"],
              "commonMistakes": ["<mistake1>","<mistake2>","<mistake3>"]
            }
            """.formatted(company, userCtx, company);

        try {
            String raw     = callGroq(prompt, 1500);
            String cleaned = cleanJson(raw);
            AiHubResponse.CompanyPrepData prep =
                    objectMapper.readValue(cleaned,
                            AiHubResponse.CompanyPrepData.class);

            gamificationService.recordActivity(user,
                    XpAction.RESUME_ANALYSIS);

            return ResponseEntity.ok(ApiResponse.success(
                    "Company prep generated",
                    AiHubResponse.builder()
                            .mode("company_prep")
                            .companyPrep(prep)
                            .xpEarned(20)
                            .build()));
        } catch (Exception e) {
            throw new RuntimeException(
                    "Company prep failed: " + e.getMessage());
        }
    }

    // ── Active Resume Text ───────────────────────────────────────
    @GetMapping("/active-resume-text")
    public ResponseEntity<ApiResponse<Map<String, String>>>
            getActiveResumeText() throws Exception {

        User user = securityUtils.getCurrentUser();
        Resume resume = resumeRepository
                .findByUserAndIsActiveTrue(user)
                .orElseThrow(() -> new RuntimeException(
                        "No active resume found"));

        java.nio.file.Path path = fileStorageService.getFilePath(
                user.getId(), resume.getFileName());
        org.springframework.core.io.Resource res =
                new org.springframework.core.io.UrlResource(
                        path.toUri());

        String text;
        try (PDDocument doc = Loader.loadPDF(
                new RandomAccessReadBuffer(res.getInputStream()))) {
            PDFTextStripper s = new PDFTextStripper();
            text = s.getText(doc);
        }

        return ResponseEntity.ok(ApiResponse.success("Resume text",
                Map.of("text", text,
                       "label", resume.getLabel(),
                       "version", String.valueOf(
                               resume.getVersionNumber()))));
    }

    // ── Career Readiness Score ───────────────────────────────────
    @GetMapping("/readiness")
    public ResponseEntity<ApiResponse<Map<String, Object>>>
            getReadiness() {

        User user = securityUtils.getCurrentUser();
        Map<String, Object> readiness = new LinkedHashMap<>();

        // Profile completion
        int profileScore = 0;
        var profOpt = profileRepository.findByUser(user);
        if (profOpt.isPresent()) {
            var p = profOpt.get();
            if (p.getSkills()        != null) profileScore += 20;
            if (p.getGithubUrl()     != null) profileScore += 10;
            if (p.getLinkedinUrl()   != null) profileScore += 10;
            if (p.getCollegeName()   != null) profileScore += 10;
            if (p.getBio()           != null) profileScore += 10;
            if (p.getTargetRoleGoal()!= null) profileScore += 10;
            if (p.getProfilePicture()!= null) profileScore += 10;
        }

        // Resume ATS
        int atsScore = resumeRepository
                .findByUserAndIsActiveTrue(user)
                .map(r -> r.getAtsScore() != null
                        ? r.getAtsScore() : 0)
                .orElse(0);

        // Overall readiness
        int overall = (profileScore + atsScore) / 2;

        readiness.put("profileScore",    profileScore);
        readiness.put("atsScore",        atsScore);
        readiness.put("overallReadiness", overall);
        readiness.put("hasActiveResume",
                resumeRepository.findByUserAndIsActiveTrue(user)
                        .isPresent());

        return ResponseEntity.ok(
                ApiResponse.success("Readiness loaded", readiness));
    }

    // ── Helpers ──────────────────────────────────────────────────
    private String buildUserContext(User user) {
        StringBuilder sb = new StringBuilder("User Context:\n");
        sb.append("Name: ").append(user.getName()).append("\n");
        profileRepository.findByUser(user).ifPresent(p -> {
            if (p.getSkills()         != null)
                sb.append("Skills: ").append(p.getSkills()).append("\n");
            if (p.getTargetRoleGoal() != null)
                sb.append("Target Role: ")
                  .append(p.getTargetRoleGoal()).append("\n");
            if (p.getCollegeName()    != null)
                sb.append("College: ")
                  .append(p.getCollegeName()).append("\n");
        });
        return sb.toString();
    }

    private String callGroq(String prompt, int maxTokens) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(groqApiKey);

        Map<String, Object> msg  = Map.of(
                "role", "user", "content", prompt);
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("model",       groqModel);
        body.put("messages",    List.of(msg));
        body.put("temperature", 0.3);
        body.put("max_tokens",  maxTokens);

        HttpEntity<Map<String, Object>> entity =
                new HttpEntity<>(body, headers);

        ResponseEntity<Map> resp = restTemplate.exchange(
                groqApiUrl, HttpMethod.POST, entity, Map.class);

        Map<?, ?> rb = resp.getBody();
        List<?> choices = (List<?>) rb.get("choices");
        Map<?, ?> c   = (Map<?, ?>) choices.get(0);
        Map<?, ?> m   = (Map<?, ?>) c.get("message");
        return m.get("content").toString();
    }

    private String cleanJson(String raw) {
        String c = raw.replaceAll("(?s)```json\\s*","")
                      .replaceAll("(?s)```\\s*","").trim();
        int s = c.indexOf('{'), e = c.lastIndexOf('}');
        if (s != -1 && e != -1) c = c.substring(s, e+1);
        return c;
    }
}

