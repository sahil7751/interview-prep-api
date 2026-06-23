package com.jobtracker.controller;

import com.jobtracker.dto.request.ResumeGenerateRequest;
import com.jobtracker.dto.response.ApiResponse;
import com.jobtracker.dto.response.GeneratedResumeResponse;
import com.jobtracker.service.ResumeGeneratorService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/resume-gen")
@RequiredArgsConstructor
@Tag(name = "Resume Generator", description = "AI-powered resume generation from job description")
public class ResumeGeneratorController {

    private final ResumeGeneratorService resumeGeneratorService;

    // POST /api/v1/resume-gen/generate
    @PostMapping("/generate")
    @Operation(summary = "Generate resume content from JD")
    public ResponseEntity<ApiResponse<GeneratedResumeResponse>> generate(
            @Valid @RequestBody ResumeGenerateRequest request) {

        GeneratedResumeResponse response = resumeGeneratorService.generateResume(request);
        return ResponseEntity.ok(
                ApiResponse.success("Resume generated", response));
    }

    // POST /api/v1/resume-gen/download-pdf
    @PostMapping("/download-pdf")
    @Operation(summary = "Generate and download resume as PDF")
    public ResponseEntity<byte[]> downloadPdf(
            @Valid @RequestBody ResumeGenerateRequest request)
            throws Exception {

        byte[] pdf = resumeGeneratorService.generatePdf(request);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDisposition(
                ContentDisposition.attachment()
                        .filename("generated-resume.pdf")
                        .build());

        return ResponseEntity.ok()
                .headers(headers)
                .body(pdf);
    }
}
