package com.jobtracker.controller;

import com.jobtracker.dto.request.InterviewRequest;
import com.jobtracker.dto.response.ApiResponse;
import com.jobtracker.dto.response.InterviewResponse;
import com.jobtracker.dto.response.PagedResponse;
import com.jobtracker.service.InterviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;



@RestController
@RequestMapping("/api/v1/interviews")
@RequiredArgsConstructor
public class InterviewController {

    private final InterviewService interviewService;

    @PostMapping
    public ResponseEntity<ApiResponse<InterviewResponse>> create(
            @Valid @RequestBody InterviewRequest request) {

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success("Interview logged",
                        interviewService.create(request)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PagedResponse<InterviewResponse>>> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Long applicationId) {

        return ResponseEntity.ok(
                ApiResponse.success("Interviews fetched",
                        interviewService.getAll(page, size,
                                keyword, applicationId)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<InterviewResponse>> getById(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                ApiResponse.success("Interview fetched",
                        interviewService.getById(id)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<InterviewResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody InterviewRequest request) {

        return ResponseEntity.ok(
                ApiResponse.success("Interview updated",
                        interviewService.update(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<String>> delete(
            @PathVariable Long id) {

        interviewService.delete(id);
        return ResponseEntity.ok(
                ApiResponse.success("Interview deleted", null));
    }
}

