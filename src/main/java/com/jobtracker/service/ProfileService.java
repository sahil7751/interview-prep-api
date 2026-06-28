
package com.jobtracker.service;

import com.jobtracker.dto.request.ChangePasswordRequest;
import com.jobtracker.dto.request.ProfileUpdateRequest;
import com.jobtracker.dto.response.ProfileCompletionResponse;
import com.jobtracker.dto.response.ProfileResponse;
import com.jobtracker.entity.User;
import com.jobtracker.entity.UserProfile;
import com.jobtracker.repository.ResumeRepository;
import com.jobtracker.repository.UserProfileRepository;
import com.jobtracker.repository.UserRepository;
import com.jobtracker.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.util.*;

import org.springframework.http.*;
import org.springframework.web.client.RestTemplate;

import com.fasterxml.jackson.databind.ObjectMapper;

import com.jobtracker.dto.response.ProfileReviewResponse;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProfileService {

    private final UserRepository userRepository;
    private final UserProfileRepository profileRepository;
    private final SecurityUtils securityUtils;
    private final PasswordEncoder passwordEncoder;
    private final ResumeRepository resumeRepository;
    private final RestTemplate restTemplate;

    @Value("${file.upload-dir:uploads/resumes}")
    private String uploadDir;

    @Value("${server.port:8081}")
    private String serverPort;

    @Value("${groq.api.key:}")
    private String groqApiKey;

    @Value("${groq.api.url:https://api.groq.com/openai/v1/chat/completions}")
    private String groqApiUrl;

    @Value("${groq.api.model:llama-3.3-70b-versatile}")
    private String groqModel;

    private final ObjectMapper objectMapper = new ObjectMapper();

    // ── GET PROFILE ──────────────────────────────────────────────
    public ProfileResponse getProfile() {
        User user = securityUtils.getCurrentUser();
        UserProfile profile = getOrCreateProfile(user);
        return toResponse(user, profile);
    }

    // ── UPDATE PROFILE ───────────────────────────────────────────
    @Transactional
    public ProfileResponse updateProfile(ProfileUpdateRequest req) {
        User user = securityUtils.getCurrentUser();
        UserProfile profile = getOrCreateProfile(user);

        // Validate username uniqueness
        if (req.getUsername() != null && !req.getUsername().isBlank()) {
            if (profileRepository.existsByUsernameAndUserNot(
                    req.getUsername(), user)) {
                throw new RuntimeException(
                        "Username '" + req.getUsername()
                                + "' is already taken");
            }
            profile.setUsername(req.getUsername());
        }

        // Update User entity name
        user.setName(req.getName());
        userRepository.save(user);

        // Update profile fields
        profile.setPhone(req.getPhone());
        profile.setLocation(req.getLocation());
        profile.setBio(req.getBio());
        profile.setCollegeName(req.getCollegeName());
        profile.setDegree(req.getDegree());
        profile.setBranch(req.getBranch());
        profile.setGraduationYear(req.getGraduationYear());
        profile.setCgpa(req.getCgpa());
        profile.setExperienceYears(req.getExperienceYears());
        profile.setCurrentCompany(req.getCurrentCompany());
        profile.setCurrentRole(req.getCurrentRole());
        profile.setGithubUrl(req.getGithubUrl());
        profile.setLinkedinUrl(req.getLinkedinUrl());
        profile.setPortfolioUrl(req.getPortfolioUrl());
        profile.setTargetRoleGoal(req.getTargetRoleGoal());
        profile.setPreferredCompanies(req.getPreferredCompanies());
        profile.setPreferredLocation(req.getPreferredLocation());
        profile.setExpectedSalary(req.getExpectedSalary());
        profile.setJobType(req.getJobType());
        profile.setLeetcodeUrl(req.getLeetcodeUrl());
        profile.setCodechefUrl(req.getCodechefUrl());
        profile.setCodeforcesUrl(req.getCodeforcesUrl());

        // Convert skills list to comma-separated string
        if (req.getSkills() != null) {
            profile.setSkills(String.join(",", req.getSkills()));
        }

        profileRepository.save(profile);
        log.info("Profile updated for user: {}", user.getEmail());

        return toResponse(user, profile);
    }

    // ── UPLOAD PROFILE PICTURE ───────────────────────────────────
    @Transactional
    public ProfileResponse uploadPicture(MultipartFile file)
            throws IOException {

        User user = securityUtils.getCurrentUser();
        UserProfile profile = getOrCreateProfile(user);

        // Validate file
        if (file.isEmpty()) {
            throw new RuntimeException("File is empty");
        }
        String originalName = file.getOriginalFilename();
        if (originalName == null) {
            throw new RuntimeException("Invalid file");
        }
        String ext = originalName.substring(
                originalName.lastIndexOf('.') + 1).toLowerCase();

        if (!List.of("jpg", "jpeg", "png", "webp").contains(ext)) {
            throw new RuntimeException(
                    "Only JPG, PNG or WEBP images allowed");
        }
        if (file.getSize() > 2 * 1024 * 1024) {
            throw new RuntimeException("Image must be under 2 MB");
        }

        // Save to disk
        Path picDir = Paths.get(uploadDir, "pictures",
                String.valueOf(user.getId()));
        Files.createDirectories(picDir);

        String storedName = UUID.randomUUID() + "." + ext;
        Files.copy(file.getInputStream(),
                picDir.resolve(storedName),
                StandardCopyOption.REPLACE_EXISTING);

        // Delete old picture
        if (profile.getProfilePicture() != null) {
            Path oldPic = picDir.resolve(profile.getProfilePicture());
            Files.deleteIfExists(oldPic);
        }

        profile.setProfilePicture(storedName);
        profileRepository.save(profile);

        return toResponse(user, profile);
    }

    // ── CHANGE PASSWORD ──────────────────────────────────────────
    @Transactional
    public void changePassword(ChangePasswordRequest req) {
        User user = securityUtils.getCurrentUser();

        if (!passwordEncoder.matches(req.getCurrentPassword(),
                user.getPassword())) {
            throw new RuntimeException("Current password is incorrect");
        }

        if (!req.getNewPassword().equals(req.getConfirmPassword())) {
            throw new RuntimeException("Passwords do not match");
        }

        user.setPassword(
                passwordEncoder.encode(req.getNewPassword()));
        userRepository.save(user);

        log.info("Password changed for user: {}", user.getEmail());
    }

    // ── PROFILE COMPLETION ───────────────────────────────────────
    public ProfileCompletionResponse getCompletion() {
        User user = securityUtils.getCurrentUser();
        UserProfile profile = getOrCreateProfile(user);

        List<String> completed = new ArrayList<>();
        List<String> missing = new ArrayList<>();

        check("Name", user.getName(), completed, missing);
        check("Email", user.getEmail(), completed, missing);
        check("Username", profile.getUsername(), completed, missing);
        check("Phone", profile.getPhone(), completed, missing);
        check("Location", profile.getLocation(), completed, missing);
        check("Bio", profile.getBio(), completed, missing);
        check("College", profile.getCollegeName(), completed, missing);
        check("Degree", profile.getDegree(), completed, missing);
        check("Skills", profile.getSkills(), completed, missing);
        check("GitHub URL", profile.getGithubUrl(), completed, missing);
        check("LinkedIn URL", profile.getLinkedinUrl(), completed, missing);
        check("Profile Picture", profile.getProfilePicture(),
                completed, missing);

        int total = completed.size() + missing.size();
        int percentage = (int) Math.round(
                (completed.size() * 100.0) / total);

        String message = percentage == 100
                ? "Profile is complete!"
                : "Complete your profile to increase visibility";

        return ProfileCompletionResponse.builder()
                .percentage(percentage)
                .completedFields(completed)
                .missingFields(missing)
                .message(message)
                .build();
    }

    // ── HELPERS ──────────────────────────────────────────────────

    private UserProfile getOrCreateProfile(User user) {
        return profileRepository.findByUser(user)
                .orElseGet(() -> {
                    UserProfile p = UserProfile.builder()
                            .user(user)
                            .build();
                    return profileRepository.save(p);
                });
    }

    private void check(String field, String value,
            List<String> completed, List<String> missing) {
        if (value != null && !value.isBlank()) {
            completed.add(field);
        } else {
            missing.add(field);
        }
    }

    private ProfileResponse toResponse(User user, UserProfile profile) {
        // Parse skills
        List<String> skillList = new ArrayList<>();
        if (profile.getSkills() != null
                && !profile.getSkills().isBlank()) {
            skillList = Arrays.asList(
                    profile.getSkills().split(","));
            skillList = skillList.stream()
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .toList();
        }

        // Build picture URL
        String pictureUrl = null;
        if (profile.getProfilePicture() != null) {
            pictureUrl = "http://localhost:" + serverPort
                    + "/api/v1/profile/picture";
        }

        // Calculate completion
        ProfileCompletionResponse completion = getCompletionFor(
                user, profile);

                var activeResume = resumeRepository
                .findByUserAndIsActiveTrue(user);

        return ProfileResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .username(profile.getUsername())
                .phone(profile.getPhone())
                .location(profile.getLocation())
                .bio(profile.getBio())
                .collegeName(profile.getCollegeName())
                .degree(profile.getDegree())
                .branch(profile.getBranch())
                .graduationYear(profile.getGraduationYear())
                .cgpa(profile.getCgpa())
                .experienceYears(profile.getExperienceYears())
                .currentCompany(profile.getCurrentCompany())
                .currentRole(profile.getCurrentRole())
                .skills(skillList)
                .githubUrl(profile.getGithubUrl())
                .linkedinUrl(profile.getLinkedinUrl())
                .portfolioUrl(profile.getPortfolioUrl())
                .profilePictureUrl(pictureUrl)
                .completionPercentage(completion.getPercentage())
                .updatedAt(profile.getUpdatedAt())
                .targetRoleGoal(profile.getTargetRoleGoal())
                .preferredCompanies(profile.getPreferredCompanies())
                .preferredLocation(profile.getPreferredLocation())
                .expectedSalary(profile.getExpectedSalary())
                .jobType(profile.getJobType())
                .leetcodeUrl(profile.getLeetcodeUrl())
                .codechefUrl(profile.getCodechefUrl())
                .codeforcesUrl(profile.getCodeforcesUrl())

                .activeResumeVersion(
                        activeResume
                                .map(r -> r.getVersionNumber())
                                .orElse(null))

                .activeResumeAtsScore(
                        activeResume
                                .map(r -> r.getAtsScore())
                                .orElse(null))

                .activeResumeLabel(
                        activeResume
                                .map(r -> r.getLabel())
                                .orElse(null))

                .activeResumeUpdatedAt(
                        activeResume
                                .map(r -> r.getUploadedAt() != null
                                        ? r.getUploadedAt().toLocalDate().toString()
                                        : null)
                                .orElse(null))

                .build();
    }

    private ProfileCompletionResponse getCompletionFor( User user, UserProfile profile) {

        List<String> completed = new ArrayList<>();
        List<String> missing = new ArrayList<>();

        check("Name", user.getName(), completed, missing);
        check("Email", user.getEmail(), completed, missing);
        check("Username", profile.getUsername(), completed, missing);
        check("Phone", profile.getPhone(), completed, missing);
        check("Location", profile.getLocation(), completed, missing);
        check("Bio", profile.getBio(), completed, missing);
        check("College", profile.getCollegeName(), completed, missing);
        check("Degree", profile.getDegree(), completed, missing);
        check("Skills", profile.getSkills(), completed, missing);
        check("GitHub URL", profile.getGithubUrl(), completed, missing);
        check("LinkedIn URL", profile.getLinkedinUrl(), completed, missing);
        check("Profile Picture", profile.getProfilePicture(),
                completed, missing);

        int total = completed.size() + missing.size();
        int percentage = (int) Math.round(
                (completed.size() * 100.0) / total);

        return ProfileCompletionResponse.builder()
                .percentage(percentage)
                .completedFields(completed)
                .missingFields(missing)
                .build();
        
            }

            public ProfileReviewResponse reviewProfile() {
                User user = securityUtils.getCurrentUser();
                UserProfile profile = getOrCreateProfile(user);

                String prompt = """
                        You are an expert career counselor reviewing a student's profile.
                        Analyze and respond ONLY with valid JSON, no markdown.

                        Profile:
                        Name: %s
                        Skills: %s
                        College: %s
                        Degree: %s
                        Branch: %s
                        Graduation Year: %s
                        CGPA: %s
                        Target Role: %s
                        Experience: %s years
                        GitHub: %s
                        LinkedIn: %s

                        Return this exact JSON:
                        {
                          "overallScore": <0-100>,
                          "placementReadiness": "<Ready|Almost Ready|Needs Work|Not Ready>",
                          "strengths": ["<strength1>", "<strength2>"],
                          "weaknesses": ["<weakness1>", "<weakness2>"],
                          "missingSkills": ["<skill1>", "<skill2>"],
                          "recommendedTechnologies": ["<tech1>", "<tech2>"],
                          "resumeSuggestions": ["<suggestion1>", "<suggestion2>"],
                          "recommendedCompanies": ["<company1>", "<company2>"],
                          "summary": "<2-3 sentence overall assessment>"
                        }
                        """.formatted(
                        user.getName(),
                        profile.getSkills() != null
                                ? profile.getSkills()
                                : "Not specified",
                        profile.getCollegeName() != null
                                ? profile.getCollegeName()
                                : "Not specified",
                        profile.getDegree() != null
                                ? profile.getDegree()
                                : "Not specified",
                        profile.getBranch() != null
                                ? profile.getBranch()
                                : "Not specified",
                        profile.getGraduationYear() != null
                                ? profile.getGraduationYear()
                                : "Not specified",
                        profile.getCgpa() != null
                                ? profile.getCgpa()
                                : "Not specified",
                        profile.getTargetRoleGoal() != null
                                ? profile.getTargetRoleGoal()
                                : "Not specified",
                        profile.getExperienceYears() != null
                                ? profile.getExperienceYears()
                                : 0,
                        profile.getGithubUrl() != null
                                ? "Present"
                                : "Missing",
                        profile.getLinkedinUrl() != null
                                ? "Present"
                                : "Missing");

                try {
                    String raw = callGroq(prompt);
                    String cleaned = raw
                            .replaceAll("(?s)```json\\s*", "")
                            .replaceAll("(?s)```\\s*", "").trim();
                    int s = cleaned.indexOf('{');
                    int e = cleaned.lastIndexOf('}');
                    if (s != -1 && e != -1)
                        cleaned = cleaned.substring(s, e + 1);
                    return objectMapper.readValue(cleaned,
                            ProfileReviewResponse.class);
                } catch (Exception ex) {
                    log.error("Profile review failed: {}", ex.getMessage());
                    throw new RuntimeException(
                            "AI review failed: " + ex.getMessage());
                }
            }

            private String callGroq(String prompt) {
                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(
                        org.springframework.http.MediaType.APPLICATION_JSON);
                headers.setBearerAuth(groqApiKey);

                java.util.Map<String, Object> message = java.util.Map.of(
                        "role", "user", "content", prompt);
                java.util.Map<String, Object> body = new java.util.LinkedHashMap<>();
                body.put("model", groqModel);
                body.put("messages", java.util.List.of(message));
                body.put("temperature", 0.3);
                body.put("max_tokens", 1500);

                HttpEntity<java.util.Map<String, Object>> entity = new org.springframework.http.HttpEntity<>(
                        body, headers);

                ResponseEntity<java.util.Map> response = restTemplate.exchange(groqApiUrl,
                        HttpMethod.POST,
                        entity, java.util.Map.class);

                java.util.Map<?, ?> rb = response.getBody();
                java.util.List<?> choices = (java.util.List<?>) rb.get("choices");
                java.util.Map<?, ?> choice = (java.util.Map<?, ?>) choices.get(0);
                java.util.Map<?, ?> msg = (java.util.Map<?, ?>) choice.get("message");
                return msg.get("content").toString();
            }
}



