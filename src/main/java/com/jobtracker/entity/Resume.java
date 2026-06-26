package com.jobtracker.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "resumes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Resume {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "file_name", nullable = false)
    private String fileName;

    @Column(name = "original_name", nullable = false)
    private String originalName;

    @Column(name = "file_path", nullable = false)
    private String filePath;

    @Column(name = "file_size")
    private Long fileSize;

    @Column(name = "version_number")
    private Integer versionNumber;

    @Column(name = "is_active")
    private Boolean isActive;

    @Column(name = "label")
    private String label;

    @Column(name = "role_tag")
    private String roleTag; // e.g. "Backend Developer"

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes; // personal notes about this version

    @Column(name = "ats_score")
    private Integer atsScore; // stored after scanning

    @Column(name = "ats_label")
    private String atsLabel; // Excellent / Good / Average / Poor

    @Column(name = "target_companies")
    private String targetCompanies; // comma-separated

    @Column(name = "uploaded_at")
    private LocalDateTime uploadedAt;

    @PrePersist
    protected void onCreate() {
        uploadedAt = LocalDateTime.now();
        if (isActive == null)
            isActive = false;
    }
}

