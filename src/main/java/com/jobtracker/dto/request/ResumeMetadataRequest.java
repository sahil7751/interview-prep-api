package com.jobtracker.dto.request;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ResumeMetadataRequest {
    private String label;
    private String roleTag;
    private String notes;
    private String targetCompanies;
}

