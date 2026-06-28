
package com.jobtracker.controller;

import com.jobtracker.dto.request.ChangePasswordRequest;
import com.jobtracker.dto.request.ProfileUpdateRequest;
import com.jobtracker.dto.response.*;
import com.jobtracker.entity.User;
import com.jobtracker.entity.UserProfile;
import com.jobtracker.repository.UserProfileRepository;
import com.jobtracker.security.SecurityUtils;
import com.jobtracker.service.ProfileService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;

@RestController
@RequestMapping("/api/v1/profile")
@RequiredArgsConstructor
@Tag(name = "Profile", description = "User profile management")
public class ProfileController {

    private final ProfileService profileService;
    private final SecurityUtils securityUtils;
    private final UserProfileRepository profileRepository;

    @Value("${file.upload-dir:uploads/resumes}")
    private String uploadDir;

    // GET /api/v1/profile
    @GetMapping
    @Operation(summary = "Get current user profile")
    public ResponseEntity<ApiResponse<ProfileResponse>> getProfile() {
        return ResponseEntity.ok(
                ApiResponse.success("Profile fetched",
                        profileService.getProfile()));
    }

    // PUT /api/v1/profile
    @PutMapping
    @Operation(summary = "Update profile")
    public ResponseEntity<ApiResponse<ProfileResponse>> updateProfile(
            @Valid @RequestBody ProfileUpdateRequest request) {
        return ResponseEntity.ok(
                ApiResponse.success("Profile updated",
                        profileService.updateProfile(request)));
    }

    // POST /api/v1/profile/picture
    @PostMapping("/picture")
    @Operation(summary = "Upload profile picture")
    public ResponseEntity<ApiResponse<ProfileResponse>> uploadPicture(
            @RequestParam("file") MultipartFile file)
            throws IOException {
        return ResponseEntity.ok(
                ApiResponse.success("Picture uploaded",
                        profileService.uploadPicture(file)));
    }

    @GetMapping("/picture")
    public ResponseEntity<Resource> getPicture() throws IOException {
            User user = securityUtils.getCurrentUser();
            UserProfile profile = profileRepository
                            .findByUser(user)
                            .orElse(null);

            if (profile == null || profile.getProfilePicture() == null) {
                    return ResponseEntity.notFound().build();
            }

            Path picPath = Paths.get(uploadDir, "pictures",
                            String.valueOf(user.getId()),
                            profile.getProfilePicture());

            Resource resource = new UrlResource(picPath.toUri());
            if (!resource.exists() || !resource.isReadable()) {
                    return ResponseEntity.notFound().build();
            }

            String filename = profile.getProfilePicture().toLowerCase();
            String contentType = filename.endsWith(".png")
                            ? "image/png"
                            : filename.endsWith(".webp")
                                            ? "image/webp"
                                            : "image/jpeg";

            return ResponseEntity.ok()
                            .contentType(MediaType.parseMediaType(contentType))
                            .header(HttpHeaders.CACHE_CONTROL,
                                            "no-cache, no-store, must-revalidate")
                            .header(HttpHeaders.PRAGMA, "no-cache")
                            .header(HttpHeaders.EXPIRES, "0")
                            .body(resource);
    }

    // PUT /api/v1/profile/password
    @PutMapping("/password")
    @Operation(summary = "Change password")
    public ResponseEntity<ApiResponse<String>> changePassword(
            @Valid @RequestBody ChangePasswordRequest request) {
        profileService.changePassword(request);
        return ResponseEntity.ok(
                ApiResponse.success("Password changed successfully",
                        null));
    }

    // GET /api/v1/profile/completion
    @GetMapping("/completion")
    @Operation(summary = "Get profile completion percentage")
    public ResponseEntity<ApiResponse<ProfileCompletionResponse>> getCompletion() {
        return ResponseEntity.ok(
                ApiResponse.success("Completion fetched",
                        profileService.getCompletion()));
    }

        @PostMapping("/review")
        @Operation(summary = "AI profile review and analysis")
        public ResponseEntity<ApiResponse<ProfileReviewResponse>>
                reviewProfile() {
        return ResponseEntity.ok(
                ApiResponse.success("Profile reviewed",
                        profileService.reviewProfile()));
        }
}

