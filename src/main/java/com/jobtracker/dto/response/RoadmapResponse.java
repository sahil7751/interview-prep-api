package com.jobtracker.dto.response;

import lombok.*;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoadmapResponse {
    private Long id;
    private String targetRole;
    private String experienceLevel;
    private String currentSkills;
    private int durationWeeks;
    private int totalMilestones;
    private int completedMilestones;
    private int completionPercent;
    private boolean active;
    private LocalDateTime createdAt;

    // Milestones grouped by week
    private Map<Integer, List<MilestoneResponse>> weeklyPlan;

    // Summary per week
    private List<WeekSummary> weekSummaries;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class WeekSummary {
        private int weekNumber;
        private String title;
        private int totalTopics;
        private int completedTopics;
        private int estimatedHours;
        private String category;
    }
}


