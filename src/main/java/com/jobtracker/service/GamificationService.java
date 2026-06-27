package com.jobtracker.service;

import com.jobtracker.dto.response.CheckinResponse;
import com.jobtracker.dto.response.GamificationStatsResponse;
import com.jobtracker.dto.response.GamificationStatsResponse.XpTransactionResponse;
import com.jobtracker.entity.*;
import com.jobtracker.repository.*;
import com.jobtracker.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class GamificationService {

    private final UserGamificationRepository gamificationRepository;
    private final XpTransactionRepository xpTransactionRepository;
    private final SecurityUtils securityUtils;

    // ── Level thresholds ─────────────────────────────────────────
    private static final int[] LEVEL_XP = { 0, 50, 150, 350, 700 };
    private static final String[] LEVEL_NAMES = {
            "Beginner", "Learner", "Problem Solver",
            "Interview Ready", "Placement Warrior"
    };

    // ── GET STATS ────────────────────────────────────────────────
    public GamificationStatsResponse getStats() {
        User user = securityUtils.getCurrentUser();
        UserGamification stats = getOrCreate(user);

        return buildResponse(user, stats);
    }

    // ── DAILY CHECK-IN ───────────────────────────────────────────
    @Transactional
    public CheckinResponse checkIn() {

            User user = securityUtils.getCurrentUser();

            recordActivity(user, XpAction.DAILY_CHECKIN);

            UserGamification stats = getOrCreate(user);

            return CheckinResponse.builder()
                            .alreadyCheckedIn(false)
                            .xpEarned(XpAction.DAILY_CHECKIN.getXpPoints())
                            .totalXp(stats.getTotalXp())
                            .currentStreak(stats.getCurrentStreak())
                            .currentLevel(stats.getCurrentLevel())
                            .message("Activity recorded!")
                            .build();
    }

    // ── RECORD ACTIVITY (replaces manual check-in) ───────────────
    @Transactional
    public void recordActivity(User user, XpAction action) {
            UserGamification stats = getOrCreate(user);

            LocalDate today = LocalDate.now();

            // Auto-continue streak on first activity of the day
            if (!today.equals(stats.getLastCheckinDate())) {
                    if (stats.getLastCheckinDate() != null
                                    && stats.getLastCheckinDate()
                                                    .equals(today.minusDays(1))) {
                            stats.setCurrentStreak(stats.getCurrentStreak() + 1);
                    } else {
                            stats.setCurrentStreak(1);
                    }
                    if (stats.getCurrentStreak() > stats.getLongestStreak()) {
                            stats.setLongestStreak(stats.getCurrentStreak());
                    }
                    stats.setLastCheckinDate(today);
                    stats.setTotalCheckins(stats.getTotalCheckins() + 1);

                    // Award daily bonus XP
                    int dailyBonus = XpAction.DAILY_CHECKIN.getXpPoints();
                    stats.setTotalXp(stats.getTotalXp() + dailyBonus);
                    logTransaction(user, XpAction.DAILY_CHECKIN, dailyBonus);
                    log.info("Auto daily bonus: {} streak={}",
                                    user.getEmail(), stats.getCurrentStreak());
            }

            // Award action XP
            int xp = action.getXpPoints();
            stats.setTotalXp(stats.getTotalXp() + xp);
            stats.setCurrentLevel(calculateLevel(stats.getTotalXp()));
            gamificationRepository.save(stats);
            logTransaction(user, action, xp);

            log.info("XP recorded: {} got {} XP for {}",
                            user.getEmail(), xp, action.name());
    }

    // ── AWARD XP (called from other services) ───────────────────
    @Transactional
    public void awardXp(User user, XpAction action) {
            recordActivity(user, action);
    }

    // ── HELPERS ──────────────────────────────────────────────────

    private UserGamification getOrCreate(User user) {
        return gamificationRepository.findByUser(user)
                .orElseGet(() -> {
                    UserGamification g = UserGamification.builder()
                            .user(user)
                            .build();
                    return gamificationRepository.save(g);
                });
    }

    private String calculateLevel(int totalXp) {
        String level = LEVEL_NAMES[0];
        for (int i = LEVEL_XP.length - 1; i >= 0; i--) {
            if (totalXp >= LEVEL_XP[i]) {
                level = LEVEL_NAMES[i];
                break;
            }
        }
        return level;
    }

    private int getLevelIndex(String levelName) {
        for (int i = 0; i < LEVEL_NAMES.length; i++) {
            if (LEVEL_NAMES[i].equals(levelName))
                return i;
        }
        return 0;
    }

    private void logTransaction(User user,
            XpAction action,
            int xpEarned) {
        XpTransaction tx = XpTransaction.builder()
                .user(user)
                .action(action)
                .xpEarned(xpEarned)
                .description(action.getDescription())
                .build();
        xpTransactionRepository.save(tx);
    }

    private GamificationStatsResponse buildResponse(
            User user, UserGamification stats) {

        int totalXp = stats.getTotalXp();
        int levelIndex = getLevelIndex(stats.getCurrentLevel());

        // XP within current level
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

        // Check if checked in today
        boolean checkedInToday = LocalDate.now()
                .equals(stats.getLastCheckinDate());

        // Recent activity
        List<XpTransactionResponse> recent = xpTransactionRepository
                .findTop10ByUserOrderByCreatedAtDesc(user)
                .stream()
                .map(tx -> XpTransactionResponse.builder()
                        .action(tx.getAction().name())
                        .description(tx.getDescription())
                        .xpEarned(tx.getXpEarned())
                        .createdAt(tx.getCreatedAt()
                                .format(DateTimeFormatter
                                        .ofPattern("dd MMM, hh:mm a")))
                        .build())
                .toList();

        return GamificationStatsResponse.builder()
                .totalXp(totalXp)
                .currentLevel(stats.getCurrentLevel())
                .xpForNextLevel(xpForNextLevel)
                .xpProgress(xpProgress)
                .progressPercent(progressPercent)
                .nextLevel(nextLevel)
                .currentStreak(stats.getCurrentStreak())
                .longestStreak(stats.getLongestStreak())
                .checkedInToday(checkedInToday)
                .totalCheckins(stats.getTotalCheckins())
                .lastCheckinDate(stats.getLastCheckinDate())
                .recentActivity(recent)
                .build();
    }
}



