package com.jobtracker.dto.response;

import lombok.*;
import java.util.List;
  
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardResponse {

    // ── Application Stats ────────────────────────────────────────
    private long totalApplications;
    private long appliedCount;
    private long inProgressCount;
    private long selectedCount;
    private long rejectedCount;
    private long offerReceivedCount;
    private double successRate;
    private double rejectionRate;
    private int xpProgress; // XP within current level
    private int xpForNextLevel; // XP needed for next level

    // ── Gamification Stats ───────────────────────────────────────
    private int totalXp;
    private String currentLevel;
    private int currentStreak;
    private int longestStreak;
    private boolean checkedInToday;
    private int progressPercent; // % toward next level
    private String nextLevel;
    private int totalCheckins;

    // ── Practice Stats ───────────────────────────────────────────
    private long totalQuestionsAnswered;
    private double averageInterviewScore; // avg across all sessions
    private long totalPracticeSessions;

    // ── Profile ──────────────────────────────────────────────────
    private int profileCompletion;

    // ── Chart Data ───────────────────────────────────────────────
    private List<MonthlyCount> monthlyTrend;
    private List<StatusCount> statusBreakdown;

    // ── Recent Activity ──────────────────────────────────────────
    private List<RecentActivity> recentActivity;

    // ── Inner classes ────────────────────────────────────────────
    @Getter
    @Setter
    @AllArgsConstructor
    @NoArgsConstructor
    public static class MonthlyCount {
        private String month;
        private long count;
    }

    @Getter
    @Setter
    @AllArgsConstructor
    @NoArgsConstructor
    public static class StatusCount {
        private String status;
        private long count;
    }

    @Getter
    @Setter
    @AllArgsConstructor
    @NoArgsConstructor
    @Builder
    public static class RecentActivity {
        private String type; // "APPLICATION", "XP", "PRACTICE"
        private String title;
        private String subtitle;
        private String time;
        private String icon;
        private String color;
    }
}

