package com.jobtracker.service;

import com.jobtracker.dto.response.DashboardResponse;
import com.jobtracker.dto.response.DashboardResponse.*;
import com.jobtracker.entity.*;
import com.jobtracker.repository.*;
import com.jobtracker.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Month;
import java.time.format.TextStyle;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class DashboardService {

        private final ApplicationRepository applicationRepository;
        private final InterviewQaRecordRepository qaRecordRepository;
        private final InterviewPracticeSessionRepository sessionRepository;
        private final UserGamificationRepository gamificationRepository;
        private final UserProfileRepository profileRepository;
        private final XpTransactionRepository xpTransactionRepository;
        private final SecurityUtils securityUtils;

        // Level thresholds (must match GamificationService)
        private static final int[] LEVEL_XP = { 0, 50, 150, 350, 700 };
        private static final String[] LEVEL_NAMES = { "Beginner", "Learner", "Problem Solver",
                        "Interview Ready", "Placement Warrior" };

        public DashboardResponse getDashboard() {
                User user = securityUtils.getCurrentUser();

                // ── Application Stats ────────────────────────────────────
                long total = applicationRepository.countByUser(user);
                long applied = applicationRepository
                                .countByUserAndStatus(user, ApplicationStatus.APPLIED);
                long selected = applicationRepository
                                .countByUserAndStatus(user, ApplicationStatus.SELECTED);
                long rejected = applicationRepository
                                .countByUserAndStatus(user, ApplicationStatus.REJECTED);
                long offer = applicationRepository
                                .countByUserAndStatus(user,
                                                ApplicationStatus.OFFER_RECEIVED);
                long inProgress = total - applied - selected
                                - rejected - offer;

                double successRate = total > 0
                                ? Math.round((selected + offer) * 100.0 / total
                                                * 10) / 10.0
                                : 0.0;
                double rejectionRate = total > 0
                                ? Math.round(rejected * 100.0 / total * 10) / 10.0
                                : 0.0;

                // ── Monthly Trend ────────────────────────────────────────
                List<Object[]> monthlyRaw = applicationRepository.getMonthlyApplicationCounts(user);
                List<MonthlyCount> monthlyTrend = new ArrayList<>();
                for (Object[] row : monthlyRaw) {
                        int m = ((Number) row[0]).intValue();
                        int y = ((Number) row[1]).intValue();
                        long count = ((Number) row[2]).longValue();
                        String label = Month.of(m).getDisplayName(
                                        TextStyle.SHORT, Locale.ENGLISH) + " " + y;
                        monthlyTrend.add(new MonthlyCount(label, count));
                }

                // ── Status Breakdown ─────────────────────────────────────
                List<Object[]> statusRaw = applicationRepository.getStatusCounts(user);
                List<StatusCount> statusBreakdown = new ArrayList<>();
                for (Object[] row : statusRaw) {
                        statusBreakdown.add(new StatusCount(
                                        row[0].toString(),
                                        ((Number) row[1]).longValue()));
                }

                // ── Gamification Stats ───────────────────────────────────
                UserGamification gam = gamificationRepository
                                .findByUser(user)
                                .orElse(null);

                int totalXp = gam != null ? gam.getTotalXp() : 0;
                String currentLevel = gam != null ? gam.getCurrentLevel() : "Beginner";
                int currentStreak = gam != null ? gam.getCurrentStreak() : 0;
                int longestStreak = gam != null ? gam.getLongestStreak() : 0;
                int totalCheckins = gam != null ? gam.getTotalCheckins() : 0;
                boolean checkedInToday = gam != null
                                && java.time.LocalDate.now()
                                                .equals(gam.getLastCheckinDate());

                // Level progress calculation
                int levelIndex = getLevelIndex(currentLevel);
                int levelStartXp = LEVEL_XP[levelIndex];
                int levelEndXp = levelIndex < LEVEL_XP.length - 1
                                ? LEVEL_XP[levelIndex + 1]
                                : LEVEL_XP[levelIndex] + 500;
                int xpProgress = totalXp - levelStartXp;
                int xpForNextLevel = levelEndXp - levelStartXp;
                int progressPercent = (int) Math.min(100,
                                (xpProgress * 100.0) / xpForNextLevel);
                String nextLevel = levelIndex < LEVEL_NAMES.length - 1
                                ? LEVEL_NAMES[levelIndex + 1]
                                : "MAX LEVEL";

                // ── Practice Stats ───────────────────────────────────────
                long totalAnswered = qaRecordRepository
                                .countByUserAndIsEvaluatedTrue(user);
                Double avgScore = qaRecordRepository
                                .findAverageScoreByUser(user);
                double averageScore = avgScore != null
                                ? Math.round(avgScore * 10.0) / 10.0
                                : 0.0;
                long totalSessions = sessionRepository.countByUser(user);

                // ── Profile Completion ───────────────────────────────────
                int profileCompletion = getProfileCompletion(user);

                // ── Recent Activity ──────────────────────────────────────
                List<RecentActivity> recentActivity = buildRecentActivity(user);

                return DashboardResponse.builder()
                                // Applications
                                .totalApplications(total)
                                .appliedCount(applied)
                                .inProgressCount(inProgress)
                                .selectedCount(selected)
                                .rejectedCount(rejected)
                                .offerReceivedCount(offer)
                                .successRate(successRate)
                                .rejectionRate(rejectionRate)
                                // Charts
                                .monthlyTrend(monthlyTrend)
                                .statusBreakdown(statusBreakdown)
                                // Gamification
                                .totalXp(totalXp)
                                .currentLevel(currentLevel)
                                .currentStreak(currentStreak)
                                .longestStreak(longestStreak)
                                .checkedInToday(checkedInToday)
                                .progressPercent(progressPercent)
                                .nextLevel(nextLevel)
                                .totalCheckins(totalCheckins)
                                // Practice
                                .totalQuestionsAnswered(totalAnswered)
                                .averageInterviewScore(averageScore)
                                .totalPracticeSessions(totalSessions)
                                // Profile
                                .profileCompletion(profileCompletion)
                                // Activity
                                .recentActivity(recentActivity)
                                .xpProgress(xpProgress)
                                .xpForNextLevel(xpForNextLevel)
                                .build();
        }

        // ── Helpers ──────────────────────────────────────────────────

        private int getLevelIndex(String levelName) {
                for (int i = 0; i < LEVEL_NAMES.length; i++) {
                        if (LEVEL_NAMES[i].equals(levelName))
                                return i;
                }
                return 0;
        }

        private int getProfileCompletion(User user) {
                return profileRepository.findByUser(user)
                                .map(profile -> {
                                        int filled = 0;
                                        int total = 12;
                                        if (isSet(user.getName()))
                                                filled++;
                                        if (isSet(user.getEmail()))
                                                filled++;
                                        if (isSet(profile.getUsername()))
                                                filled++;
                                        if (isSet(profile.getPhone()))
                                                filled++;
                                        if (isSet(profile.getLocation()))
                                                filled++;
                                        if (isSet(profile.getBio()))
                                                filled++;
                                        if (isSet(profile.getCollegeName()))
                                                filled++;
                                        if (isSet(profile.getDegree()))
                                                filled++;
                                        if (isSet(profile.getSkills()))
                                                filled++;
                                        if (isSet(profile.getGithubUrl()))
                                                filled++;
                                        if (isSet(profile.getLinkedinUrl()))
                                                filled++;
                                        if (isSet(profile.getProfilePicture()))
                                                filled++;
                                        return (int) Math.round(
                                                        (filled * 100.0) / total);
                                })
                                .orElse(16); // name + email only = ~16%
        }

        private boolean isSet(String value) {
                return value != null && !value.isBlank();
        }

        private List<RecentActivity> buildRecentActivity(User user) {
                List<RecentActivity> activities = new ArrayList<>();

                // Last 5 XP transactions
                xpTransactionRepository
                                .findTop10ByUserOrderByCreatedAtDesc(user)
                                .stream()
                                .limit(5)
                                .forEach(tx -> activities.add(
                                                RecentActivity.builder()
                                                                .type("XP")
                                                                .title(tx.getDescription())
                                                                .subtitle("+" + tx.getXpEarned()
                                                                                + " XP earned")
                                                                .time(tx.getCreatedAt()
                                                                                .toLocalDate().toString())
                                                                .icon("⚡")
                                                                .color("indigo")
                                                                .build()));

                // Sort by time desc (already ordered from DB)
                return activities;
        }
} 