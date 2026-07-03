package com.jobtracker.dto.response;

import lombok.*;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiHubResponse {
    private String mode;
    private String rawContent;
    private int xpEarned;

    // Structured data per mode
    private ResumeAnalysisResponse resumeAnalysis;
    private AtsScanResponse atsAnalysis;
    private SkillGapResponse skillGap;
    private InterviewQuestionsResponse questions;
    private CompanyPrepData companyPrep;
    private String chatReply;
    private String placementPrep;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CompanyPrepData {
        private String company;
        private String hiringProcess;
        private String salaryRange;
        private List<String> frequentQuestions;
        private List<String> dsaTopics;
        private List<String> behavioralQuestions;
        private List<String> preparationStrategy;
        private List<String> commonMistakes;
        private String interviewPattern;
    }
}

