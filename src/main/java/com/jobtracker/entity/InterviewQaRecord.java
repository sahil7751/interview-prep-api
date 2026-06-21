package com.jobtracker.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "interview_qa_records")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InterviewQaRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false)
    private InterviewPracticeSession session;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String question;

    private String difficulty;    // Easy / Medium / Hard
    private String category;      // Technical / Behavioural / HR

    @Column(name = "user_answer", columnDefinition = "TEXT")
    private String userAnswer;

    @Column(name = "ai_score")
    private Double aiScore;       // 0.0 - 10.0

    @Column(columnDefinition = "TEXT")
    private String strengths;     // JSON array stored as string

    @Column(columnDefinition = "TEXT")
    private String weaknesses;

    @Column(name = "improvement_suggestions",
            columnDefinition = "TEXT")
    private String improvementSuggestions;

    @Column(name = "ideal_answer", columnDefinition = "TEXT")
    private String idealAnswer;

    @Column(name = "is_evaluated")
    private Boolean isEvaluated;

    @Column(name = "evaluated_at")
    private LocalDateTime evaluatedAt;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt   = LocalDateTime.now();
        isEvaluated = false;
    }
}


