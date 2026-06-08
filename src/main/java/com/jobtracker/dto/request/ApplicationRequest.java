package com.jobtracker.dto.request;

import com.jobtracker.entity.ApplicationStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
public class ApplicationRequest {

    @NotBlank(message = "Company name is required")
    private String companyName;

    @NotBlank(message = "Job role is required")
    private String jobRole;

    private BigDecimal packageCtc;
    private String location;
    private LocalDate applicationDate;

    @NotNull(message = "Status is required")
    private ApplicationStatus status;

    private String jobDescription;
    private String applicationLink;
    private String notes;
}
