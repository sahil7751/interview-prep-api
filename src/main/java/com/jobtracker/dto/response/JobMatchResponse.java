package com.jobtracker.dto.response;

import lombok.*;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JobMatchResponse {

    // Overall match
    private int matchScore; // 0 - 100
    private String matchLabel; // Strong / Good / Fair / Weak
    private String overallFeedback;
    private String recommendation; // Apply now / Improve first / Not ready

    // Skill breakdown
    private List<String> matchedSkills;
    private List<String> missingSkills;
    private List<String> partialSkills; // have related but not exact

    // Keyword breakdown
    private List<String> matchedKeywords;
    private List<String> missingKeywords;

    // Experience & Education
    private String experienceMatch; // Meets / Below / Exceeds requirement
    private String educationMatch;
    private String experienceFeedback;
    private String educationFeedback;

    // Category scores
    private int skillsScore; // 0 - 100
    private int keywordsScore;
    private int experienceScore;
    private int educationScore;
    private int overallFormatScore;

    // Action items
    private List<String> topImprovements; // ordered by impact
    private List<String> resumeTweaks; // quick resume edits
    private List<String> skillsToLearn; // longer term

    // Estimated effort
    private String estimatedTimeToReady; // e.g. "1 week" / "Ready now"
}

