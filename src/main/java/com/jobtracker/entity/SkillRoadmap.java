package com.jobtracker.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "skill_roadmaps")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SkillRoadmap {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "target_role", nullable = false)
    private String targetRole;

    @Column(name = "experience_level")
    private String experienceLevel;

    @Column(name = "current_skills", columnDefinition = "TEXT")
    private String currentSkills;

    @Column(name = "duration_weeks")
    private int durationWeeks;

    @Column(name = "total_milestones")
    private int totalMilestones;

    @Column(name = "completed_milestones")
    private int completedMilestones;

    @Column(name = "completion_percent")
    private int completionPercent;

    @Column(name = "is_active")
    private boolean isActive;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "roadmap", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    @OrderBy("weekNumber ASC, orderIndex ASC")
    private List<RoadmapMilestone> milestones;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        completedMilestones = 0;
        completionPercent = 0;
        isActive = true;
    }
}

