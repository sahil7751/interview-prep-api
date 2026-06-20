package com.jobtracker.dto.response;

import lombok.*;
import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GamificationStatsResponse {

    // XP & Level
    private int totalXp;
    private String currentLevel;
    private int xpForNextLevel;
    private int xpProgress; // XP earned within current level
    private int progressPercent; // % toward next level

    // Streak
    private int currentStreak;
    private int longestStreak;
    private boolean checkedInToday;

    // Check-in
    private int totalCheckins;
    private LocalDate lastCheckinDate;

    // Recent activity
    private List<XpTransactionResponse> recentActivity;

    // Level info
    private String nextLevel;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class XpTransactionResponse {
        private String action;
        private String description;
        private int xpEarned;
        private String createdAt;
    }
}



