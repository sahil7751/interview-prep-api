package com.jobtracker.dto.response;

import lombok.*;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardResponse {

    // Summary counts
    private long totalApplications;
    private long appliedCount;
    private long inProgressCount;
    private long selectedCount;
    private long rejectedCount;
    private long offerReceivedCount;

    // Rates
    private double successRate;
    private double rejectionRate;

    // Trend data for chart
    private List<MonthlyCount> monthlyTrend;

    // Status breakdown for pie chart
    private List<StatusCount> statusBreakdown;

    @Getter @Setter @AllArgsConstructor @NoArgsConstructor
    public static class MonthlyCount {
        private String month;   // "Jan 2025"
        private long count;
    }

    @Getter @Setter @AllArgsConstructor @NoArgsConstructor
    public static class StatusCount {
        private String status;
        private long count;
    }
}
