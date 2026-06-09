package com.jobtracker.controller;

import com.jobtracker.dto.response.ApiResponse;
import com.jobtracker.dto.response.DashboardResponse;
import com.jobtracker.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;


@RestController
@RequestMapping("/api/v1/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping
    public ResponseEntity<ApiResponse<DashboardResponse>> getDashboard() {
        return ResponseEntity.ok(
                ApiResponse.success("Dashboard data fetched",
                        dashboardService.getDashboard()));
    }
}

