package com.jobtracker.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ResumeAnalysisRequest {

    @NotBlank(message = "Resume text is required")
    private String resumeText; // paste resume content as text

    private String jobDescription; // optional target JD
}
