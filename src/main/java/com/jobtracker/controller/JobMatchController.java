package com.jobtracker.controller;

import com.jobtracker.dto.request.JobMatchRequest;
import com.jobtracker.dto.response.ApiResponse;
import com.jobtracker.dto.response.JobMatchResponse;
import com.jobtracker.service.JobMatchService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/job-match")
@RequiredArgsConstructor
@Tag(name = "Job Match", description = "AI-powered resume to job description matching")
public class JobMatchController {

    private final JobMatchService jobMatchService;

    // POST /api/v1/job-match/analyze
    @PostMapping("/analyze")
    @Operation(summary = "Match resume text against job description")
    public ResponseEntity<ApiResponse<JobMatchResponse>> analyze(
            @Valid @RequestBody JobMatchRequest request) {

        return ResponseEntity.ok(
                ApiResponse.success("Match analyzed",
                        jobMatchService.analyzeMatch(request)));
    }

    // POST /api/v1/job-match/analyze-pdf
    @PostMapping("/analyze-pdf")
    @Operation(summary = "Match uploaded PDF resume against JD")
    public ResponseEntity<ApiResponse<JobMatchResponse>> analyzePdf(
            @RequestParam("file") MultipartFile file,
            @RequestParam("jobDescription") String jobDescription,
            @RequestParam(value = "targetRole", required = false) String targetRole,
            @RequestParam(value = "experienceLevel", defaultValue = "Fresher") String experienceLevel)
            throws Exception {

        return ResponseEntity.ok(
                ApiResponse.success("Match analyzed",
                        jobMatchService.analyzeMatchPdf(
                                file, jobDescription,
                                targetRole, experienceLevel)));
    }
}

