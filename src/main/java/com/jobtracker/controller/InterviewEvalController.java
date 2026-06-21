package com.jobtracker.controller;

import com.jobtracker.dto.request.EvaluateAnswerRequest;
import com.jobtracker.dto.request.StartSessionRequest;
import com.jobtracker.dto.response.*;
import com.jobtracker.service.InterviewEvalService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/interview-eval")
@RequiredArgsConstructor
@Tag(name = "Interview Evaluation", description = "AI-powered interview practice and evaluation")
public class InterviewEvalController {

    private final InterviewEvalService evalService;

    // POST /api/v1/interview-eval/start
    @PostMapping("/start")
    @Operation(summary = "Start a practice session")
    public ResponseEntity<ApiResponse<PracticeSessionResponse>> start(
            @Valid @RequestBody StartSessionRequest request) {

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(
                        "Session started",
                        evalService.startSession(request)));
    }

    // POST /api/v1/interview-eval/evaluate
    @PostMapping("/evaluate")
    @Operation(summary = "Submit answer for AI evaluation")
    public ResponseEntity<ApiResponse<EvaluationResponse>> evaluate(
            @Valid @RequestBody EvaluateAnswerRequest request) {

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Answer evaluated",
                        evalService.evaluateAnswer(request)));
    }

    // GET /api/v1/interview-eval/sessions
    @GetMapping("/sessions")
    @Operation(summary = "List all practice sessions")
    public ResponseEntity<ApiResponse<PagedResponse<PracticeSessionResponse>>> getSessions(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Sessions fetched",
                        evalService.getAllSessions(page, size)));
    }

    // GET /api/v1/interview-eval/sessions/{id}
    @GetMapping("/sessions/{id}")
    @Operation(summary = "Get session with all questions")
    public ResponseEntity<ApiResponse<PracticeSessionResponse>> getSession(@PathVariable Long id) {

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Session fetched",
                        evalService.getSession(id)));
    }

    // GET /api/v1/interview-eval/ideal/{questionId}
    @GetMapping("/ideal/{questionId}")
    @Operation(summary = "Get ideal answer for a question")
    public ResponseEntity<ApiResponse<Map<String, String>>> getIdealAnswer(@PathVariable Long questionId) {

        String ideal = evalService.getIdealAnswer(questionId);
        return ResponseEntity.ok(
                ApiResponse.success("Ideal answer fetched",
                        Map.of("idealAnswer", ideal)));
    }
}


