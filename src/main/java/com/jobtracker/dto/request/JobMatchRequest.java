package com.jobtracker.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class JobMatchRequest {

    @NotBlank(message = "Resume text is required")
    private String resumeText;

    @NotBlank(message = "Job description is required")
    private String jobDescription;

    private String targetRole;
    private String experienceLevel = "Fresher";
}

