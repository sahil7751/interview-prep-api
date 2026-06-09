package com.jobtracker.controller;

import com.jobtracker.dto.request.ApplicationRequest;
import com.jobtracker.dto.response.ApiResponse;
import com.jobtracker.dto.response.ApplicationResponse;
import com.jobtracker.service.ApplicationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;


@RestController
@RequestMapping("/api/v1/applications")
@RequiredArgsConstructor
public class ApplicationController {

    private final ApplicationService applicationService;

    // GET /api/v1/applications
    // Optional params: page, size, sortBy, sortDir, keyword, status
    @GetMapping
    public ResponseEntity<ApiResponse<Page<ApplicationResponse>>> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String status) {

        Page<ApplicationResponse> result = applicationService.getAll(page, size, sortBy, sortDir, keyword, status);

        return ResponseEntity.ok(ApiResponse.success("Applications fetched", result));
    }

    // GET /api/v1/applications/{id}
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ApplicationResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(
                ApiResponse.success("Application fetched", applicationService.getById(id)));
    }

    // POST /api/v1/applications
    @PostMapping
    public ResponseEntity<ApiResponse<ApplicationResponse>> create(
            @Valid @RequestBody ApplicationRequest request) {
        return ResponseEntity.ok(
                ApiResponse.success("Application created", applicationService.create(request)));
    }

    // PUT /api/v1/applications/{id}
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ApplicationResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody ApplicationRequest request) {
        return ResponseEntity.ok(
                ApiResponse.success("Application updated", applicationService.update(id, request)));
    }

    // PATCH /api/v1/applications/{id}/status?value=SELECTED
    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<ApplicationResponse>> updateStatus(
            @PathVariable Long id,
            @RequestParam String value) {
        return ResponseEntity.ok(
                ApiResponse.success("Status updated", applicationService.updateStatus(id, value)));
    }

    // DELETE /api/v1/applications/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        applicationService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Application deleted", null));
    }
}

