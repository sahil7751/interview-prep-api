package com.jobtracker.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "applications")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Application {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "company_name", nullable = false)
    private String companyName;

    @Column(name = "job_role", nullable = false)
    private String jobRole;

    @Column(name = "package_ctc")
    private BigDecimal packageCtc;

    private String location;

    @Column(name = "application_date")
    private LocalDate applicationDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ApplicationStatus status;

    @Column(name = "job_description", columnDefinition = "TEXT")
    private String jobDescription;

    @Column(name = "application_link")
    private String applicationLink;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "last_updated")
    private LocalDateTime lastUpdated;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        lastUpdated = LocalDateTime.now();
        if (applicationDate == null)
            applicationDate = LocalDate.now();
        if (status == null)
            status = ApplicationStatus.APPLIED;
    }

    @PreUpdate
    protected void onUpdate() {
        lastUpdated = LocalDateTime.now();
    }
}
