package com.jobtracker.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ResumeGenerateRequest {

    @NotBlank(message = "Job description is required")
    private String jobDescription;

    private String targetRole;
    private String experienceLevel = "Fresher";

    // Optional user info to personalize
    private String fullName;
    private String email;
    private String phone;
    private String location;
    private String existingSkills;
    private String existingProjects;
    private String education;
}

