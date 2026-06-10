package com.jobtracker.dto.response;

import lombok.*;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SkillGapResponse {

    private List<String> presentSkills;
    private List<String> missingSkills;
    private List<String> niceToHaveSkills;
    private int matchPercentage;
    private List<LearningResource> learningPath;
    private String summary;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LearningResource {
        private String skill;
        private String suggestedResource; // "Spring Boot - Official Docs / Udemy"
        private String estimatedTime; // "2 weeks"
    }
}
