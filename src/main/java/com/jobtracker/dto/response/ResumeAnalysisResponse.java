package com.jobtracker.dto.response;

import lombok.*;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ResumeAnalysisResponse {

    private int atsScore; // 0-100
    private String scoreLabel; // "Good", "Average", "Needs Work"
    private List<String> strengths;
    private List<String> weaknesses;
    private List<String> missingKeywords;
    private List<String> improvementSuggestions;
    private String overallFeedback;
}
