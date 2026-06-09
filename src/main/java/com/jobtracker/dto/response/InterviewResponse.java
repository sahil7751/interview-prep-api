package com.jobtracker.dto.response;

import com.jobtracker.entity.InterviewResult;
import com.jobtracker.entity.InterviewType;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InterviewResponse {

    private Long id;
    private String companyName;
    private Long applicationId; // null if not linked
    private String applicationRole; // job role from linked application
    private LocalDateTime interviewDate;
    private InterviewType interviewType;
    private String questionsAsked;
    private String personalNotes;
    private InterviewResult result;
    private LocalDateTime createdAt;
}

