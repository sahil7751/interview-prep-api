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
    private String fileSizeReadable; // "245 KB"
    private Integer versionNumber;
    private Boolean isActive;
    private String label;
    private LocalDateTime uploadedAt;
    private String downloadUrl;
}
