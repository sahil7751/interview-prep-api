package com.jobtracker.controller;

import com.jobtracker.dto.request.CareerCoachRequest;
import com.jobtracker.dto.response.ApiResponse;
import com.jobtracker.dto.response.CareerCoachResponse;
import com.jobtracker.service.CareerCoachService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/career-coach")
@RequiredArgsConstructor
@Tag(name = "Career Coach", description = "AI Career Coach")
public class CareerCoachController {

    private final CareerCoachService careerCoachService;

    @PostMapping("/chat")
    public ResponseEntity<ApiResponse<CareerCoachResponse>> chat(
            @Valid @RequestBody CareerCoachRequest request) {
        return ResponseEntity.ok(
                ApiResponse.success("Response received",
                        careerCoachService.chat(request)));
    }

    @GetMapping("/daily-insight")
    public ResponseEntity<ApiResponse<Map<String, String>>> dailyInsight() {
        return ResponseEntity.ok(
                ApiResponse.success("Daily insight",
                        careerCoachService.getDailyInsight()));
    }

    @GetMapping("/weekly-review")
    public ResponseEntity<ApiResponse<Map<String, Object>>> weeklyReview() {
        return ResponseEntity.ok(
                ApiResponse.success("Weekly review",
                        careerCoachService.getWeeklyReview()));
    }
}

