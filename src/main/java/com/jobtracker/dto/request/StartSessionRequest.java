package com.jobtracker.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class StartSessionRequest {

    @NotBlank(message = "Job role is required")
    private String jobRole;

    @NotBlank(message = "Job description is required")
    private String jobDescription;

    private String experienceLevel = "Fresher";

    private int questionCount = 5;
}


