package com.jobtracker.dto.response;

import com.jobtracker.entity.ApplicationStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApplicationResponse {

    private Long id;
    private String companyName;
    private String jobRole;
    private BigDecimal packageCtc;
    private String location;
    private LocalDate applicationDate;
    private ApplicationStatus status;
    private String jobDescription;
    private String applicationLink;
    private String notes;
    private LocalDateTime lastUpdated;
    private LocalDateTime createdAt;
}

