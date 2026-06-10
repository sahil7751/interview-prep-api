package com.jobtracker.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class InterviewQuestionsRequest {

    @NotBlank(message = "Job description is required")
    private String jobDescription;

    private String jobRole; // e.g. "Software Engineer"
    private String experienceLevel; // e.g. "Fresher", "2 years"

    private int questionCount = 10; // default 10 questions
}
