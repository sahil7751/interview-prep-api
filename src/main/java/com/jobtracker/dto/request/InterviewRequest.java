package com.jobtracker.dto.request;

import com.jobtracker.entity.InterviewResult;
import com.jobtracker.entity.InterviewType;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class InterviewRequest {

    @NotBlank(message = "Company name is required")
    private String companyName;

    private Long applicationId; // optional link
    private LocalDateTime interviewDate;
    private InterviewType interviewType;
    private String questionsAsked;
    private String personalNotes;
    private InterviewResult result;
}