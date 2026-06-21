package com.jobtracker.dto.response;

import lombok.*;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EvaluationResponse {

    private Long questionId;
    private String question;
    private String userAnswer;
    private String category;
    private String difficulty;

    // AI Evaluation
    private double score; // 0.0 - 10.0
    private String scoreLabel; // Excellent / Good / Average / Poor
    private List<String> strengths;
    private List<String> weaknesses;
    private List<String> improvementSuggestions;
    private String idealAnswer;
    private String overallFeedback;

    // XP
    private int xpEarned;
    private int totalXp;
}



