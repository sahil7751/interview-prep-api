package com.jobtracker.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "roadmap_milestones")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoadmapMilestone {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "roadmap_id", nullable = false)
    private SkillRoadmap roadmap;

    @Column(name = "week_number")
    private int weekNumber;

    @Column(name = "week_title")
    private String weekTitle;

    @Column(name = "topic", nullable = false)
    private String topic;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "resource")
    private String resource;

    @Column(name = "resource_type")
    private String resourceType;  // Video / Book / Practice / Project

    @Column(name = "estimated_hours")
    private int estimatedHours;

    @Column(name = "order_index")
    private int orderIndex;

    @Column(name = "is_completed")
    private boolean isCompleted;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "category")
    private String category;  // Foundation / Core / Advanced / Project
}

