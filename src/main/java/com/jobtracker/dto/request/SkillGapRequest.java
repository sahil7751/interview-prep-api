package com.jobtracker.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SkillGapRequest {

    @NotBlank(message = "Job description is required")
    private String jobDescription;

    @NotBlank(message = "Current skills are required")
    private String currentSkills; // comma separated: "Java, Spring, MySQL"

    private String targetRole;
}
