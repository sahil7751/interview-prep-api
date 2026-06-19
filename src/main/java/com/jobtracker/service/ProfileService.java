
package com.jobtracker.service;

import com.jobtracker.dto.request.ChangePasswordRequest;
import com.jobtracker.dto.request.ProfileUpdateRequest;
import com.jobtracker.dto.response.ProfileCompletionResponse;
import com.jobtracker.dto.response.ProfileResponse;
import com.jobtracker.entity.User;
import com.jobtracker.entity.UserProfile;
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

@Service
@RequiredArgsConstructor
@Slf4j
public class ProfileService {

    private final UserRepository userRepository;
    private final UserProfileRepository profileRepository;
    private final SecurityUtils securityUtils;
    private final PasswordEncoder passwordEncoder;

    @Value("${file.upload-dir:uploads/resumes}")
    private String uploadDir;

    @Value("${server.port:8081}")
    private String serverPort;

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

    private ProfileResponse toResponse(User user,
            UserProfile profile) {
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
                .build();
    }

    private ProfileCompletionResponse getCompletionFor(
            User user, UserProfile profile) {

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
}



