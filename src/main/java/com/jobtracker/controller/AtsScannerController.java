package com.jobtracker.controller;

import com.jobtracker.dto.request.AtsScanTextRequest;
import com.jobtracker.dto.response.ApiResponse;
import com.jobtracker.dto.response.AtsScanResponse;
import com.jobtracker.service.AtsScannerService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/ats")
@RequiredArgsConstructor
@Tag(name = "ATS Scanner", description = "AI-powered ATS resume analysis")
public class AtsScannerController {

    private final AtsScannerService atsScannerService;

    // POST /api/v1/ats/scan (multipart PDF upload)
    @PostMapping("/scan")
    @Operation(summary = "Scan uploaded PDF resume for ATS score")
    public ResponseEntity<ApiResponse<AtsScanResponse>> scanPdf(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "jobDescription", required = false) String jobDescription) throws Exception {

        AtsScanResponse response = atsScannerService.scanPdf(file, jobDescription);
        return ResponseEntity.ok(
                ApiResponse.success("ATS scan complete", response));
    }

    // POST /api/v1/ats/scan-text (paste resume text)
    @PostMapping("/scan-text")
    @Operation(summary = "Scan pasted resume text for ATS score")
    public ResponseEntity<ApiResponse<AtsScanResponse>> scanText(
            @Valid @RequestBody AtsScanTextRequest request) {

        AtsScanResponse response = atsScannerService.scanText(request);
        return ResponseEntity.ok(
                ApiResponse.success("ATS scan complete", response));
    }
}

