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
        UserGamification stats = getOrCreate(user);

        LocalDate today = LocalDate.now();

        // Already checked in today
        if (today.equals(stats.getLastCheckinDate())) {
            return CheckinResponse.builder()
                    .alreadyCheckedIn(true)
                    .xpEarned(0)
                    .totalXp(stats.getTotalXp())
                    .currentStreak(stats.getCurrentStreak())
                    .currentLevel(stats.getCurrentLevel())
                    .message("You already checked in today! "
                            + "Come back tomorrow 🌟")
                    .build();
        }

        // Update streak
        if (stats.getLastCheckinDate() != null
                && stats.getLastCheckinDate()
                        .equals(today.minusDays(1))) {
            // Consecutive day — extend streak
            stats.setCurrentStreak(stats.getCurrentStreak() + 1);
        } else {
            // Streak broken or first check-in
            stats.setCurrentStreak(1);
        }

        // Update longest streak
        if (stats.getCurrentStreak() > stats.getLongestStreak()) {
            stats.setLongestStreak(stats.getCurrentStreak());
        }

        // Award XP
        int xpEarned = XpAction.DAILY_CHECKIN.getXpPoints();
        stats.setTotalXp(stats.getTotalXp() + xpEarned);
        stats.setLastCheckinDate(today);
        stats.setTotalCheckins(stats.getTotalCheckins() + 1);

        // Recalculate level
        String newLevel = calculateLevel(stats.getTotalXp());
        stats.setCurrentLevel(newLevel);
        gamificationRepository.save(stats);

        // Log transaction
        logTransaction(user, XpAction.DAILY_CHECKIN, xpEarned);

        log.info("Check-in: {} earned {} XP, streak: {}",
                user.getEmail(), xpEarned, stats.getCurrentStreak());

        String streakMsg = stats.getCurrentStreak() > 1
                ? " 🔥 " + stats.getCurrentStreak() + " day streak!"
                : " Keep it up!";

        return CheckinResponse.builder()
                .alreadyCheckedIn(false)
                .xpEarned(xpEarned)
                .totalXp(stats.getTotalXp())
                .currentStreak(stats.getCurrentStreak())
                .currentLevel(newLevel)
                .message("+5 XP earned!" + streakMsg)
                .build();
    }

    // ── AWARD XP (called from other services) ───────────────────
    @Transactional
    public void awardXp(User user, XpAction action) {
        UserGamification stats = getOrCreate(user);

        int xpEarned = action.getXpPoints();
        stats.setTotalXp(stats.getTotalXp() + xpEarned);
        stats.setCurrentLevel(calculateLevel(stats.getTotalXp()));
        gamificationRepository.save(stats);

        logTransaction(user, action, xpEarned);

        log.info("XP awarded: {} got {} XP for {}",
                user.getEmail(), xpEarned, action.name());
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



