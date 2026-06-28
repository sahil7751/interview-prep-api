package com.jobtracker.dto.response;

import lombok.*;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProfileReviewResponse {

    private int overallScore;
    private String placementReadiness;
    private List<String> strengths;
    private List<String> weaknesses;
    private List<String> missingSkills;
    private List<String> recommendedTechnologies;
    private List<String> resumeSuggestions;
    private List<String> recommendedCompanies;
    private String summary;
}

