package com.jobtracker.dto.response;

import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ResumeResponse {

    private Long id;
    private String fileName;
    private String originalName;
    private Long fileSize;
    private String fileSizeReadable;
    private Integer versionNumber;
    private Boolean isActive;
    private String label;

    private String roleTag;
    private String notes;
    private Integer atsScore;
    private String atsLabel;
    private String targetCompanies;
    private String atsScoreColor; // for frontend coloring

    private LocalDateTime uploadedAt;
    private String downloadUrl;
}

