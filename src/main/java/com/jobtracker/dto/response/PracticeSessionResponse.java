package com.jobtracker.dto.response;

import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PracticeSessionResponse {

    private Long id;
    private String jobRole;
    private String jobDescription;
    private String experienceLevel;
    private String interviewType;
    private String difficulty;
    private String targetCompany;
    private int totalQuestions;
    private int answeredQuestions;
    private Double averageScore;
    private boolean timedMode;
    private int timeLimitMinutes;
    private LocalDateTime createdAt;

    private List<PracticeQuestionResponse> questions;
}

