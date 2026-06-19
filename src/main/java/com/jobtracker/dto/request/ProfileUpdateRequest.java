 
package com.jobtracker.dto.request;

import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class ProfileUpdateRequest {

    @NotBlank(message = "Name is required")
    private String name;

    private String username;
    private String phone;
    private String location;
    private String bio;

    // Education
    private String collegeName;
    private String degree;
    private String branch;

    @Min(value = 2000, message = "Enter a valid graduation year")
    @Max(value = 2035, message = "Enter a valid graduation year")
    private Integer graduationYear;

    @DecimalMin(value = "0.0")
    @DecimalMax(value = "10.0")
    private Double cgpa;

    // Experience
    @Min(0)
    @Max(50)
    private Integer experienceYears;

    private String currentCompany;
    private String currentRole;

    // Skills list
    private List<String> skills;

    // Social
    private String githubUrl;
    private String linkedinUrl;
    private String portfolioUrl;
}




