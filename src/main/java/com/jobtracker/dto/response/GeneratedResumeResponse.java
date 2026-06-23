package com.jobtracker.dto.response;

import lombok.*;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GeneratedResumeResponse {

    private String targetRole;
    private String professionalSummary;
    private List<String> technicalSkills;
    private List<String> softSkills;
    private List<ExperienceSection> experience;
    private List<ProjectSection> projects;
    private List<String> achievements;
    private String educationSection;
    private List<String> atsKeywords;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ExperienceSection {
        private String company;
        private String role;
        private String duration;
        private List<String> bulletPoints;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProjectSection {
        private String name;
        private String techStack;
        private List<String> bulletPoints;
    }
}

