package com.jobtracker.controller;

import com.jobtracker.dto.request.CareerCoachRequest;
import com.jobtracker.dto.response.ApiResponse;
import com.jobtracker.dto.response.CareerCoachResponse;
import com.jobtracker.service.CareerCoachService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/career-coach")
@RequiredArgsConstructor
@Tag(name = "Career Coach", description = "AI-powered career coaching chat")
public class CareerCoachController {

    private final CareerCoachService careerCoachService;

    // POST /api/v1/career-coach/chat
    @PostMapping("/chat")
    @Operation(summary = "Send message to AI career coach")
    public ResponseEntity<ApiResponse<CareerCoachResponse>> chat(
            @Valid @RequestBody CareerCoachRequest request) {

        return ResponseEntity.ok(
                ApiResponse.success("Response received",
                        careerCoachService.chat(request)));
    }
}


