package com.jobtracker.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AtsScanTextRequest {

    @NotBlank(message = "Resume text is required")
    private String resumeText;

    private String jobDescription; // optional — improves analysis
}

