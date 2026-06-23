package com.jobtracker.dto.response;

import lombok.*;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AtsScanResponse {

    // Overall score
    private int atsScore; // 0 - 100
    private String scoreLabel; // Excellent / Good / Average / Poor
    private String overallFeedback;

    // Keyword analysis
    private List<String> foundKeywords;
    private List<String> missingKeywords;
    private List<String> suggestedKeywords;

    // Section analysis
    private List<SectionScore> sectionScores;

    // Formatting
    private List<String> formattingIssues;
    private List<String> formattingStrengths;

    // Improvements
    private List<String> improvementSuggestions;
    private List<String> quickWins; // easy fixes for big impact

    // Stats
    private int wordCount;
    private int keywordMatchPercent;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SectionScore {
        private String section; // Summary, Skills, Experience...
        private int score; // 0 - 100
        private String feedback;
        private String status; // present / missing / weak
    }
}


