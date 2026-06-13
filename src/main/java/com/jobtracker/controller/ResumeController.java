package com.jobtracker.controller;

import com.jobtracker.dto.response.ApiResponse;
import com.jobtracker.dto.response.ResumeResponse;
import com.jobtracker.service.ResumeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/resumes")
@RequiredArgsConstructor
@Tag(name = "Resumes", description = "Upload, manage, and download resumes")
public class ResumeController {

    private final ResumeService resumeService;

    // POST /api/v1/resumes/upload
    // multipart/form-data: file + optional label
    @PostMapping("/upload")
        @Operation(summary = "Upload a resume")
    public ResponseEntity<ApiResponse<ResumeResponse>> upload(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "label", required = false) String label)
            throws IOException {

        ResumeResponse response = resumeService.upload(file, label);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Resume uploaded", response));
    }

    // GET /api/v1/resumes
    @GetMapping
        @Operation(summary = "Get all resumes")
    public ResponseEntity<ApiResponse<List<ResumeResponse>>> getAll() {
        return ResponseEntity.ok(
                ApiResponse.success("Resumes fetched", resumeService.getAll()));
    }

    // GET /api/v1/resumes/{id}
    @GetMapping("/{id}")
        @Operation(summary = "Get a resume by ID")
    public ResponseEntity<ApiResponse<ResumeResponse>> getById(
            @PathVariable Long id) {
        return ResponseEntity.ok(
                ApiResponse.success("Resume fetched",
                        resumeService.getById(id)));
    }

    // GET /api/v1/resumes/{id}/download
    @GetMapping("/{id}/download")
        @Operation(summary = "Download a resume")
    public ResponseEntity<Resource> download(
            @PathVariable Long id) throws IOException {

        Resource resource = resumeService.download(id);

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "inline; filename=\"" +
                                resource.getFilename() + "\"")
                .body(resource);
    }

    // PATCH /api/v1/resumes/{id}/activate
    @PatchMapping("/{id}/activate")
        @Operation(summary = "Set a resume as active")
    public ResponseEntity<ApiResponse<ResumeResponse>> setActive(
            @PathVariable Long id) {
        return ResponseEntity.ok(
                ApiResponse.success("Resume set as active",
                        resumeService.setActive(id)));
    }

    // PATCH /api/v1/resumes/{id}/label
    @PatchMapping("/{id}/label")
        @Operation(summary = "Update a resume label")
    public ResponseEntity<ApiResponse<ResumeResponse>> updateLabel(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {

        String label = body.get("label");
        if (label == null || label.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Label cannot be empty"));
        }

        return ResponseEntity.ok(
                ApiResponse.success("Label updated",
                        resumeService.updateLabel(id, label)));
    }

    // DELETE /api/v1/resumes/{id}
    @DeleteMapping("/{id}")
        @Operation(summary = "Delete a resume")
    public ResponseEntity<ApiResponse<String>> delete(
            @PathVariable Long id) {
        resumeService.delete(id);
        return ResponseEntity.ok(
                ApiResponse.success("Resume deleted", null));
    }
}