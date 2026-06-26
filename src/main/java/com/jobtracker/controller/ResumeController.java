package com.jobtracker.controller;

import com.jobtracker.dto.request.ResumeMetadataRequest;
import com.jobtracker.dto.response.*;
import com.jobtracker.service.ResumeService;
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
public class ResumeController {

    private final ResumeService resumeService;

    // ── Existing endpoints (keep all) ─────────────────────────

    @PostMapping("/upload")
    public ResponseEntity<ApiResponse<ResumeResponse>> upload(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "label", required = false) String label)
            throws IOException {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Resume uploaded",
                        resumeService.upload(file, label)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<ResumeResponse>>> getAll() {
        return ResponseEntity.ok(
                ApiResponse.success("Resumes fetched",
                        resumeService.getAll()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ResumeResponse>> getById(
            @PathVariable Long id) {
        return ResponseEntity.ok(
                ApiResponse.success("Resume fetched",
                        resumeService.getById(id)));
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<Resource> download(
            @PathVariable Long id) throws IOException {
        Resource resource = resumeService.download(id);
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "inline; filename=\""
                                + resource.getFilename() + "\"")
                .body(resource);
    }

    @PatchMapping("/{id}/activate")
    public ResponseEntity<ApiResponse<ResumeResponse>> setActive(
            @PathVariable Long id) {
        return ResponseEntity.ok(
                ApiResponse.success("Resume set as active",
                        resumeService.setActive(id)));
    }

    @PatchMapping("/{id}/label")
    public ResponseEntity<ApiResponse<ResumeResponse>> updateLabel(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        String label = body.get("label");
        if (label == null || label.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Label required"));
        }
        return ResponseEntity.ok(
                ApiResponse.success("Label updated",
                        resumeService.updateLabel(id, label)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<String>> delete(
            @PathVariable Long id) {
        resumeService.delete(id);
        return ResponseEntity.ok(
                ApiResponse.success("Resume deleted", null));
    }

    // ── New endpoints ─────────────────────────────────────────

    // PUT /api/v1/resumes/{id}/metadata
    @PutMapping("/{id}/metadata")
    public ResponseEntity<ApiResponse<ResumeResponse>> updateMetadata(
            @PathVariable Long id,
            @RequestBody ResumeMetadataRequest request) {
        return ResponseEntity.ok(
                ApiResponse.success("Metadata updated",
                        resumeService.updateMetadata(id, request)));
    }

    // POST /api/v1/resumes/{id}/scan-ats
    @PostMapping("/{id}/scan-ats")
    public ResponseEntity<ApiResponse<ResumeResponse>> scanAts(
            @PathVariable Long id,
            @RequestParam(value = "jobDescription", required = false) String jobDescription) throws Exception {
        return ResponseEntity.ok(
                ApiResponse.success("ATS scan complete",
                        resumeService.scanAndSaveAts(
                                id, jobDescription)));
    }

    // GET /api/v1/resumes/compare?id1=1&id2=2
    @GetMapping("/compare")
    public ResponseEntity<ApiResponse<ResumeComparisonResponse>> compare(
            @RequestParam Long id1,
            @RequestParam Long id2) {
        return ResponseEntity.ok(
                ApiResponse.success("Comparison complete",
                        resumeService.compare(id1, id2)));
    }

    // GET /api/v1/resumes/role-tags
    @GetMapping("/role-tags")
    public ResponseEntity<ApiResponse<List<String>>> getRoleTags() {
        return ResponseEntity.ok(
                ApiResponse.success("Role tags fetched",
                        resumeService.getRoleTags()));
    }

    // GET /api/v1/resumes/by-role/{role}
    @GetMapping("/by-role/{role}")
    public ResponseEntity<ApiResponse<List<ResumeResponse>>> getByRole(@PathVariable String role) {
        return ResponseEntity.ok(
                ApiResponse.success("Resumes fetched",
                        resumeService.getByRoleTag(role)));
    }
}