package com.jobtracker.dto.response;

import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MilestoneResponse {
    private Long id;
    private int weekNumber;
    private String weekTitle;
    private String topic;
    private String description;
    private String resource;
    private String resourceType;
    private int estimatedHours;
    private int orderIndex;
    private boolean completed;
    private LocalDateTime completedAt;
    private String category;
}

