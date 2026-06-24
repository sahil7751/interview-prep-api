package com.jobtracker.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class GenerateRoadmapRequest {

    @NotBlank(message = "Target role is required")
    private String targetRole;

    private String experienceLevel = "Fresher";
    private String currentSkills;
    private int durationWeeks = 8; // default 8 weeks
}


