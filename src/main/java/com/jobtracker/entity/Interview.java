package com.jobtracker.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "interviews")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Interview {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // Optional link to an application
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "application_id")
    private Application application;

    @Column(name = "company_name", nullable = false)
    private String companyName;

    @Column(name = "interview_date")
    private LocalDateTime interviewDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "interview_type")
    private InterviewType interviewType;

    @Column(name = "questions_asked", columnDefinition = "TEXT")
    private String questionsAsked;

    @Column(name = "personal_notes", columnDefinition = "TEXT")
    private String personalNotes;

    @Enumerated(EnumType.STRING)
    private InterviewResult result;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (result == null)
            result = InterviewResult.AWAITING_RESULT;
    }
}
