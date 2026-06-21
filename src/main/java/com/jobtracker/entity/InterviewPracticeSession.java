package com.jobtracker.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "interview_practice_sessions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InterviewPracticeSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "job_role")
    private String jobRole;

    @Column(name = "job_description", columnDefinition = "TEXT")
    private String jobDescription;

    @Column(name = "experience_level")
    private String experienceLevel;

    @Column(name = "total_questions")
    private int totalQuestions;

    @Column(name = "answered_questions")
    private int answeredQuestions;

    @Column(name = "average_score")
    private Double averageScore;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "session", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<InterviewQaRecord> qaRecords;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        answeredQuestions = 0;
        averageScore = 0.0;
    }
}


