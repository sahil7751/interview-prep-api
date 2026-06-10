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
    private String originalName;      // original filename user uploaded

    @Column(name = "file_path", nullable = false)
    private String filePath;          // path on disk

    @Column(name = "file_size")
    private Long fileSize;            // bytes

    @Column(name = "version_number")
    private Integer versionNumber;

    @Column(name = "is_active")
    private Boolean isActive;

    @Column(name = "label")
    private String label;             // e.g. "Software Engineer Resume v3"

    @Column(name = "uploaded_at")
    private LocalDateTime uploadedAt;

    @PrePersist
    protected void onCreate() {
        uploadedAt = LocalDateTime.now();
        if (isActive == null) isActive = false;
    }
}