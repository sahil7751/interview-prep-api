package com.jobtracker.controller;

import com.jobtracker.dto.request.GenerateRoadmapRequest;
import com.jobtracker.dto.response.ApiResponse;
import com.jobtracker.dto.response.RoadmapResponse;
import com.jobtracker.service.RoadmapService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/roadmap")
@RequiredArgsConstructor
@Tag(name = "Skill Roadmap", description = "AI-generated skill roadmaps with progress tracking")
public class RoadmapController {

    private final RoadmapService roadmapService;

    // POST /api/v1/roadmap/generate
    @PostMapping("/generate")
    @Operation(summary = "Generate a new skill roadmap")
    public ResponseEntity<ApiResponse<RoadmapResponse>> generate(
            @Valid @RequestBody GenerateRoadmapRequest request) {

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(
                        "Roadmap generated",
                        roadmapService.generateRoadmap(request)));
    }

    // GET /api/v1/roadmap
    @GetMapping
    @Operation(summary = "List all my roadmaps")
    public ResponseEntity<ApiResponse<List<RoadmapResponse>>> getAll() {
        return ResponseEntity.ok(
                ApiResponse.success("Roadmaps fetched",
                        roadmapService.getAllRoadmaps()));
    }

    // GET /api/v1/roadmap/{id}
    @GetMapping("/{id}")
    @Operation(summary = "Get roadmap with all milestones")
    public ResponseEntity<ApiResponse<RoadmapResponse>> getOne(@PathVariable Long id) {
        return ResponseEntity.ok(
                ApiResponse.success("Roadmap fetched",
                        roadmapService.getRoadmap(id)));
    }

    // PATCH /api/v1/roadmap/{id}/milestone/{milestoneId}
    @PatchMapping("/{id}/milestone/{milestoneId}")
    @Operation(summary = "Toggle milestone complete/incomplete")
    public ResponseEntity<ApiResponse<RoadmapResponse>> toggleMilestone(
            @PathVariable Long id,
            @PathVariable Long milestoneId) {

        return ResponseEntity.ok(
                ApiResponse.success("Milestone updated",
                        roadmapService.toggleMilestone(
                                id, milestoneId)));
    }

    // DELETE /api/v1/roadmap/{id}
    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a roadmap")
    public ResponseEntity<ApiResponse<String>> delete(
            @PathVariable Long id) {
        roadmapService.deleteRoadmap(id);
        return ResponseEntity.ok(
                ApiResponse.success("Roadmap deleted", null));
    }
}


