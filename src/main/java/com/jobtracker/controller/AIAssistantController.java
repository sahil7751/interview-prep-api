package com.jobtracker.controller;

import com.jobtracker.dto.request.*;
import com.jobtracker.dto.response.*;
import com.jobtracker.service.AIService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/ai")
@RequiredArgsConstructor
@Tag(name = "AI Assistant", description = "AI-powered resume, interview, and prep tools")
public class AIAssistantController {

    private final AIService aiService;

    // POST /api/v1/ai/analyze-resume
    @PostMapping("/analyze-resume")
        @Operation(summary = "Analyze a resume")
    public ResponseEntity<ApiResponse<ResumeAnalysisResponse>> analyzeResume(
            @Valid @RequestBody ResumeAnalysisRequest request) {

        ResumeAnalysisResponse response = aiService.analyzeResume(request);
        return ResponseEntity.ok(
                ApiResponse.success("Resume analyzed", response));
    }

    // POST /api/v1/ai/generate-questions
    @PostMapping("/generate-questions")
        @Operation(summary = "Generate interview questions")
    public ResponseEntity<ApiResponse<InterviewQuestionsResponse>> generateQuestions(
            @Valid @RequestBody InterviewQuestionsRequest request) {

        InterviewQuestionsResponse response = aiService.generateQuestions(request);
        return ResponseEntity.ok(
                ApiResponse.success("Questions generated", response));
    }

    // POST /api/v1/ai/skill-gap
    @PostMapping("/skill-gap")
        @Operation(summary = "Analyze skill gaps")
    public ResponseEntity<ApiResponse<SkillGapResponse>> skillGap(
            @Valid @RequestBody SkillGapRequest request) {

        SkillGapResponse response = aiService.analyzeSkillGap(request);
        return ResponseEntity.ok(
                ApiResponse.success("Skill gap analyzed", response));
    }

    // POST /api/v1/ai/placement-prep
    @PostMapping("/placement-prep")
        @Operation(summary = "Generate placement preparation guidance")
    public ResponseEntity<ApiResponse<String>> placementPrep(
            @RequestBody Map<String, String> body) {

        String jobDescription = body.getOrDefault("jobDescription", "");
        String targetRole = body.getOrDefault("targetRole",
                "Software Engineer");

        String response = aiService.getPlacementPrep(
                jobDescription, targetRole);

        return ResponseEntity.ok(
                ApiResponse.success("Preparation guide generated", response));
    }
}
