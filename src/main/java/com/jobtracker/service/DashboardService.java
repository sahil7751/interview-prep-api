package com.jobtracker.service;

import com.jobtracker.dto.response.DashboardResponse;
import com.jobtracker.dto.response.DashboardResponse.MonthlyCount;
import com.jobtracker.dto.response.DashboardResponse.StatusCount;
import com.jobtracker.entity.ApplicationStatus;
import com.jobtracker.entity.User;
import com.jobtracker.repository.ApplicationRepository;
import com.jobtracker.repository.InterviewRepository;
import com.jobtracker.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Month;
import java.time.format.TextStyle;
import java.util.*;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final ApplicationRepository applicationRepository;
    private final SecurityUtils securityUtils;

    public DashboardResponse getDashboard() {
        User user = securityUtils.getCurrentUser();

        // ── Summary counts ───────────────────────────────────────
        long total = applicationRepository.countByUser(user);
        long applied = applicationRepository
                .countByUserAndStatus(user, ApplicationStatus.APPLIED);
        long selected = applicationRepository
                .countByUserAndStatus(user, ApplicationStatus.SELECTED);
        long rejected = applicationRepository
                .countByUserAndStatus(user, ApplicationStatus.REJECTED);
        long offer = applicationRepository
                .countByUserAndStatus(user, ApplicationStatus.OFFER_RECEIVED);

        // In-progress = everything except applied, selected, rejected, offer
        long inProgress = total - applied - selected - rejected - offer;

        // ── Rates ────────────────────────────────────────────────
        double successRate = total > 0
                ? Math.round((selected + offer) * 100.0 / total * 10) / 10.0
                : 0.0;
        double rejectionRate = total > 0
                ? Math.round(rejected * 100.0 / total * 10) / 10.0
                : 0.0;

        // ── Monthly trend ────────────────────────────────────────
        List<Object[]> monthlyRaw = applicationRepository.getMonthlyApplicationCounts(user);

        List<MonthlyCount> monthlyTrend = new ArrayList<>();
        for (Object[] row : monthlyRaw) {
            int monthNum = ((Number) row[0]).intValue();
            int year = ((Number) row[1]).intValue();
            long count = ((Number) row[2]).longValue();

            String label = Month.of(monthNum)
                    .getDisplayName(TextStyle.SHORT, Locale.ENGLISH)
                    + " " + year;

            monthlyTrend.add(new MonthlyCount(label, count));
        }

        // ── Status breakdown ─────────────────────────────────────
        List<Object[]> statusRaw = applicationRepository.getStatusCounts(user);

        List<StatusCount> statusBreakdown = new ArrayList<>();
        for (Object[] row : statusRaw) {
            String status = row[0].toString();
            long count = ((Number) row[1]).longValue();
            statusBreakdown.add(new StatusCount(status, count));
        }

        return DashboardResponse.builder()
                .totalApplications(total)
                .appliedCount(applied)
                .inProgressCount(inProgress)
                .selectedCount(selected)
                .rejectedCount(rejected)
                .offerReceivedCount(offer)
                .successRate(successRate)
                .rejectionRate(rejectionRate)
                .monthlyTrend(monthlyTrend)
                .statusBreakdown(statusBreakdown)
                .build();
    }
}
