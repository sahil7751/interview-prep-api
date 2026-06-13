package com.jobtracker.controller;

import com.jobtracker.dto.request.ApplicationRequest;
import com.jobtracker.dto.response.ApiResponse;
import com.jobtracker.dto.response.ApplicationResponse;
import com.jobtracker.service.ApplicationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;


@RestController
@RequestMapping("/api/v1/applications")
@RequiredArgsConstructor
@Tag(name = "Applications", description = "Manage job applications")
public class ApplicationController {

    private final ApplicationService applicationService;

    // GET /api/v1/applications
    // Optional params: page, size, sortBy, sortDir, keyword, status
    @GetMapping
    @Operation(summary = "Get all applications")
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
    @Operation(summary = "Get an application by ID")
    public ResponseEntity<ApiResponse<ApplicationResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(
                ApiResponse.success("Application fetched", applicationService.getById(id)));
    }

    // POST /api/v1/applications
    @PostMapping
    @Operation(summary = "Create a new application")
    public ResponseEntity<ApiResponse<ApplicationResponse>> create(
            @Valid @RequestBody ApplicationRequest request) {
        return ResponseEntity.ok(
                ApiResponse.success("Application created", applicationService.create(request)));
    }

    // PUT /api/v1/applications/{id}
    @PutMapping("/{id}")
    @Operation(summary = "Update an application")
    public ResponseEntity<ApiResponse<ApplicationResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody ApplicationRequest request) {
        return ResponseEntity.ok(
                ApiResponse.success("Application updated", applicationService.update(id, request)));
    }

    // PATCH /api/v1/applications/{id}/status?value=SELECTED
    @PatchMapping("/{id}/status")
    @Operation(summary = "Update application status")
    public ResponseEntity<ApiResponse<ApplicationResponse>> updateStatus(
            @PathVariable Long id,
            @RequestParam String value) {
        return ResponseEntity.ok(
                ApiResponse.success("Status updated", applicationService.updateStatus(id, value)));
    }

    // DELETE /api/v1/applications/{id}
    @DeleteMapping("/{id}")
    @Operation(summary = "Delete an application")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        applicationService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Application deleted", null));
    }
}

