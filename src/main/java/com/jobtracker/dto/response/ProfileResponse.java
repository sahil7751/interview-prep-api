package com.jobtracker.dto.response;

import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProfileResponse {

    // Basic info (from User entity)
    private Long id;
    private String name;
    private String email;
    private String role;

    // Profile fields (from UserProfile entity)
    private String username;
    private String phone;
    private String location;
    private String bio;

    // Education
    private String collegeName;
    private String degree;
    private String branch;
    private Integer graduationYear;
    private Double cgpa;

    // Experience
    private Integer experienceYears;
    private String currentCompany;
    private String currentRole;

    // Skills
    private List<String> skills;

    // Social
    private String githubUrl;
    private String linkedinUrl;
    private String portfolioUrl;

    // Picture
    private String profilePictureUrl;

    // Completion
    private int completionPercentage;

    private LocalDateTime updatedAt;
}

