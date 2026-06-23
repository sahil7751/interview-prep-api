package com.jobtracker.service;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.itextpdf.text.*;
import com.itextpdf.text.pdf.*;
import com.jobtracker.dto.request.ResumeGenerateRequest;
import com.jobtracker.dto.response.GeneratedResumeResponse;
import com.jobtracker.dto.response.GeneratedResumeResponse.*;
import com.jobtracker.entity.User;
import com.jobtracker.repository.UserProfileRepository;
import com.jobtracker.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import com.itextpdf.text.pdf.draw.LineSeparator;

import java.io.ByteArrayOutputStream;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.ArrayList;

@Service
@RequiredArgsConstructor
@Slf4j
public class ResumeGeneratorService {

    private final SecurityUtils securityUtils;
    private final UserProfileRepository profileRepository;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${groq.api.key:}")
    private String groqApiKey;

    @Value("${groq.api.url:https://api.groq.com/openai/v1/chat/completions}")
    private String groqApiUrl;

    @Value("${groq.api.model:llama-3.3-70b-versatile}")
    private String groqModel;

    // ── GENERATE RESUME CONTENT ──────────────────────────────────
    public GeneratedResumeResponse generateResume(
            ResumeGenerateRequest request) {

        User user = securityUtils.getCurrentUser();

        // Auto-fill from profile if not provided
        String name = orDefault(request.getFullName(),
                user.getName());
        String email = orDefault(request.getEmail(),
                user.getEmail());

        // Get profile data
        String phone = request.getPhone();
        String location = request.getLocation();
        String skills = request.getExistingSkills();
        String projects = request.getExistingProjects();
        String edu = request.getEducation();

        profileRepository.findByUser(user).ifPresent(p -> {
            // profile fields already set in request take priority
        });

        var profile = profileRepository.findByUser(user)
                .orElse(null);

        if (profile != null) {
            if (phone == null)
                phone = profile.getPhone();
            if (location == null)
                location = profile.getLocation();
            if (skills == null)
                skills = profile.getSkills();
            if (edu == null && profile.getCollegeName() != null) {
                edu = profile.getDegree() + " in "
                        + profile.getBranch()
                        + " — " + profile.getCollegeName()
                        + " (" + profile.getGraduationYear() + ")"
                        + (profile.getCgpa() != null
                                ? " | CGPA: " + profile.getCgpa()
                                : "");
            }
        }

        String prompt = buildPrompt(request, name, email,
                phone, location, skills, projects, edu);

        try {
            String raw = callGroq(prompt);
            String cleaned = cleanJson(raw);

            log.info("Resume generation response received");
            return objectMapper.readValue(cleaned,
                    GeneratedResumeResponse.class);

        } catch (Exception e) {
            log.error("Resume generation failed: {}",
                    e.getMessage());
            throw new RuntimeException(
                    "Failed to generate resume: " + e.getMessage());
        }
    }

    // ── GENERATE PDF ─────────────────────────────────────────────
    public byte[] generatePdf(ResumeGenerateRequest request)
            throws Exception {

        GeneratedResumeResponse resume = generateResume(request);
        User user = securityUtils.getCurrentUser();

        String name = orDefault(request.getFullName(),
                user.getName());
        String email = orDefault(request.getEmail(),
                user.getEmail());

        var profile = profileRepository.findByUser(user)
                .orElse(null);

        String phone = orDefault(request.getPhone(),
                profile != null ? profile.getPhone() : null);
        String location = orDefault(request.getLocation(),
                profile != null ? profile.getLocation() : null);
        String github = profile != null
                ? profile.getGithubUrl()
                : null;
        String linkedin = profile != null
                ? profile.getLinkedinUrl()
                : null;

        return buildPdf(resume, name, email,
                phone, location, github, linkedin);
    }

    // ── BUILD PROMPT ─────────────────────────────────────────────
    private String buildPrompt(ResumeGenerateRequest req,
            String name, String email,
            String phone, String location,
            String skills, String projects,
            String education) {
        return """
                You are an expert ATS resume writer.
                Generate a complete professional resume for:

                Candidate: %s | %s | %s | %s
                Target Role: %s
                Experience Level: %s
                Job Description: %s
                Existing Skills: %s
                Existing Projects: %s
                Education: %s

                Return ONLY valid JSON, no markdown, no extra text.
                Use this exact structure:
                {
                  "targetRole": "<role>",
                  "professionalSummary": "<3-4 sentence ATS-optimized summary>",
                  "technicalSkills": ["skill1", "skill2", "skill3"],
                  "softSkills": ["skill1", "skill2"],
                  "experience": [
                    {
                      "company": "<company or 'Freelance' or 'Academic Project'>",
                      "role": "<role title>",
                      "duration": "<e.g. Jun 2024 - Present>",
                      "bulletPoints": [
                        "<action verb + task + result with metrics>",
                        "<action verb + task + result>"
                      ]
                    }
                  ],
                  "projects": [
                    {
                      "name": "<project name>",
                      "techStack": "<tech1, tech2, tech3>",
                      "bulletPoints": [
                        "<what you built + impact>",
                        "<key feature or achievement>"
                      ]
                    }
                  ],
                  "achievements": ["<achievement1>", "<achievement2>"],
                  "educationSection": "<degree | college | year | CGPA>",
                  "atsKeywords": ["keyword1", "keyword2", "keyword3"]
                }

                Rules:
                - Use strong action verbs (Developed, Implemented, Optimized)
                - Include metrics where possible (improved by 30%%, reduced by 50ms)
                - Make it ATS-friendly with keywords from the job description
                - If no experience provided, create 1-2 academic/freelance entries
                - If no projects provided, suggest 2 relevant projects
                - Keep bullet points concise (1-2 lines each)
                """.formatted(
                name, email,
                phone != null ? phone : "+91 XXXXXXXXXX",
                location != null ? location : "India",
                req.getTargetRole() != null
                        ? req.getTargetRole()
                        : "Software Engineer",
                req.getExperienceLevel() != null
                        ? req.getExperienceLevel()
                        : "Fresher",
                req.getJobDescription(),
                skills != null ? skills : "Not specified",
                projects != null ? projects : "Not specified",
                education != null ? education : "Not specified");
    }

    // ── BUILD PDF ────────────────────────────────────────────────
    private byte[] buildPdf(GeneratedResumeResponse resume,
            String name, String email,
            String phone, String location,
            String github, String linkedin)
            throws Exception {

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        Document doc = new Document(PageSize.A4,
                36, 36, 36, 36);
        PdfWriter.getInstance(doc, baos);
        doc.open();

        // ── Fonts ─────────────────────────────────────────────
        Font nameFont = new Font(Font.FontFamily.HELVETICA,
                20, Font.BOLD,
                new BaseColor(31, 41, 55));
        Font sectionFont = new Font(Font.FontFamily.HELVETICA,
                11, Font.BOLD,
                new BaseColor(79, 70, 229));
        Font bodyFont = new Font(Font.FontFamily.HELVETICA,
                9, Font.NORMAL,
                new BaseColor(55, 65, 81));
        Font boldBody = new Font(Font.FontFamily.HELVETICA,
                9, Font.BOLD,
                new BaseColor(31, 41, 55));
        Font smallFont = new Font(Font.FontFamily.HELVETICA,
                8, Font.NORMAL,
                new BaseColor(107, 114, 128));
        Font linkFont = new Font(Font.FontFamily.HELVETICA,
                8, Font.NORMAL,
                new BaseColor(99, 102, 241));

        // ── Header ────────────────────────────────────────────
        Paragraph namePara = new Paragraph(name, nameFont);
        namePara.setAlignment(Element.ALIGN_CENTER);
        doc.add(namePara);

        // Contact line
        List<String> contactParts = new ArrayList<>();
        if (email != null)
            contactParts.add(email);
        if (phone != null)
            contactParts.add(phone);
        if (location != null)
            contactParts.add(location);
        if (github != null)
            contactParts.add(github);
        if (linkedin != null)
            contactParts.add(linkedin);

        Paragraph contact = new Paragraph(
                String.join(" | ", contactParts), smallFont);
        contact.setAlignment(Element.ALIGN_CENTER);
        contact.setSpacingAfter(4);
        doc.add(contact);

        addDivider(doc);

        // ── Professional Summary ───────────────────────────────
        if (resume.getProfessionalSummary() != null) {
            addSection(doc, "PROFESSIONAL SUMMARY", sectionFont);
            Paragraph summary = new Paragraph(
                    resume.getProfessionalSummary(), bodyFont);
            summary.setSpacingAfter(6);
            doc.add(summary);
        }

        // ── Technical Skills ──────────────────────────────────
        if (resume.getTechnicalSkills() != null
                && !resume.getTechnicalSkills().isEmpty()) {
            addSection(doc, "TECHNICAL SKILLS", sectionFont);

            String skillsLine = String.join(" • ",
                    resume.getTechnicalSkills());
            Paragraph skillsPara = new Paragraph(
                    skillsLine, bodyFont);
            skillsPara.setSpacingAfter(4);
            doc.add(skillsPara);

            if (resume.getSoftSkills() != null
                    && !resume.getSoftSkills().isEmpty()) {
                Paragraph softPara = new Paragraph(
                        "Soft Skills: "
                                + String.join(", ",
                                        resume.getSoftSkills()),
                        bodyFont);
                softPara.setSpacingAfter(6);
                doc.add(softPara);
            }
        }

        // ── Experience ────────────────────────────────────────
        if (resume.getExperience() != null
                && !resume.getExperience().isEmpty()) {
            addSection(doc, "EXPERIENCE", sectionFont);

            for (ExperienceSection exp : resume.getExperience()) {
                PdfPTable table = new PdfPTable(2);
                table.setWidthPercentage(100);
                table.setWidths(new float[] { 70, 30 });

                PdfPCell roleCell = new PdfPCell(
                        new Phrase(exp.getRole()
                                + " — " + exp.getCompany(),
                                boldBody));
                roleCell.setBorder(Rectangle.NO_BORDER);
                roleCell.setPadding(0);

                PdfPCell durCell = new PdfPCell(
                        new Phrase(exp.getDuration() != null
                                ? exp.getDuration()
                                : "",
                                smallFont));
                durCell.setBorder(Rectangle.NO_BORDER);
                durCell.setHorizontalAlignment(
                        Element.ALIGN_RIGHT);
                durCell.setPadding(0);

                table.addCell(roleCell);
                table.addCell(durCell);
                table.setSpacingAfter(2);
                doc.add(table);

                if (exp.getBulletPoints() != null) {
                    for (String bp : exp.getBulletPoints()) {
                        Paragraph bullet = new Paragraph(
                                "  • " + bp, bodyFont);
                        bullet.setIndentationLeft(10);
                        doc.add(bullet);
                    }
                }
                doc.add(new Paragraph(" "));
            }
        }

        // ── Projects ──────────────────────────────────────────
        if (resume.getProjects() != null
                && !resume.getProjects().isEmpty()) {
            addSection(doc, "PROJECTS", sectionFont);

            for (ProjectSection proj : resume.getProjects()) {
                Paragraph projTitle = new Paragraph(
                        proj.getName()
                                + (proj.getTechStack() != null
                                        ? "  |  " + proj.getTechStack()
                                        : ""),
                        boldBody);
                projTitle.setSpacingBefore(2);
                doc.add(projTitle);

                if (proj.getBulletPoints() != null) {
                    for (String bp : proj.getBulletPoints()) {
                        Paragraph bullet = new Paragraph(
                                "  • " + bp, bodyFont);
                        bullet.setIndentationLeft(10);
                        doc.add(bullet);
                    }
                }
                doc.add(new Paragraph(" "));
            }
        }

        // ── Achievements ──────────────────────────────────────
        if (resume.getAchievements() != null
                && !resume.getAchievements().isEmpty()) {
            addSection(doc, "ACHIEVEMENTS", sectionFont);
            for (String ach : resume.getAchievements()) {
                Paragraph bullet = new Paragraph(
                        "  • " + ach, bodyFont);
                bullet.setIndentationLeft(10);
                doc.add(bullet);
            }
            doc.add(new Paragraph(" "));
        }

        // ── Education ─────────────────────────────────────────
        if (resume.getEducationSection() != null) {
            addSection(doc, "EDUCATION", sectionFont);
            Paragraph edu = new Paragraph(
                    resume.getEducationSection(), bodyFont);
            edu.setSpacingAfter(6);
            doc.add(edu);
        }

        // ── ATS Keywords ──────────────────────────────────────
        if (resume.getAtsKeywords() != null
                && !resume.getAtsKeywords().isEmpty()) {
            addSection(doc, "KEY COMPETENCIES", sectionFont);
            Paragraph kw = new Paragraph(
                    String.join("  •  ",
                            resume.getAtsKeywords()),
                    smallFont);
            kw.setSpacingAfter(4);
            doc.add(kw);
        }

        doc.close();
        return baos.toByteArray();
    }

    // ── PDF Helpers ──────────────────────────────────────────────
    private void addSection(Document doc, String title,
            Font font) throws Exception {
        Paragraph p = new Paragraph(title, font);
        p.setSpacingBefore(8);
        p.setSpacingAfter(3);
        doc.add(p);
        addDivider(doc);
    }

    private void addDivider(Document doc) throws Exception {
        LineSeparator ls = new LineSeparator();
        ls.setLineColor(new BaseColor(229, 231, 235));
        ls.setLineWidth(0.5f);
        doc.add(new Chunk(ls));
        doc.add(new Paragraph(" ") {
            {
                setSpacingAfter(2);
            }
        });
    }

    // ── Groq Call ────────────────────────────────────────────────
    private String callGroq(String prompt) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(groqApiKey);

        Map<String, Object> message = Map.of(
                "role", "user", "content", prompt);

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("model", groqModel);
        body.put("messages", List.of(message));
        body.put("temperature", 0.4);
        body.put("max_tokens", 3000);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<Map> response = restTemplate.exchange(
                    groqApiUrl, HttpMethod.POST,
                    entity, Map.class);

            Map<?, ?> responseBody = response.getBody();
            if (responseBody == null) {
                throw new RuntimeException(
                        "Empty response from Groq");
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

    private String orDefault(String value, String fallback) {
        return (value != null && !value.isBlank())
                ? value
                : fallback;
    }
}

