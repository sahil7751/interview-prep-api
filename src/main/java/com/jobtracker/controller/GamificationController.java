package com.jobtracker.controller;

import com.jobtracker.dto.response.ApiResponse;
import com.jobtracker.dto.response.CheckinResponse;
import com.jobtracker.dto.response.GamificationStatsResponse;
import com.jobtracker.service.GamificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/gamification")
@RequiredArgsConstructor
@Tag(name = "Gamification", description = "XP, levels, streaks and daily check-in")
public class GamificationController {

    private final GamificationService gamificationService;

    // GET /api/v1/gamification/stats
    @GetMapping("/stats")
    @Operation(summary = "Get XP, level and streak stats")
    public ResponseEntity<ApiResponse<GamificationStatsResponse>> getStats() {
        return ResponseEntity.ok(
                ApiResponse.success("Stats fetched",
                        gamificationService.getStats()));
    }

    // POST /api/v1/gamification/checkin
    @PostMapping("/checkin")
    @Operation(summary = "Daily check-in to earn XP")
    public ResponseEntity<ApiResponse<CheckinResponse>> checkIn() {
        return ResponseEntity.ok(
                ApiResponse.success("Check-in processed",
                        gamificationService.checkIn()));
    }
}

