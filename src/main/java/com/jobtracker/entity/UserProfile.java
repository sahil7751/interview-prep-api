package com.jobtracker.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_profiles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(unique = true)
    private String username;

    private String phone;
    private String location;

    @Column(columnDefinition = "TEXT")
    private String bio;

    // Education
    @Column(name = "college_name")
    private String collegeName;

    @Column(name = "degree")
    private String degree;

    @Column(name = "branch")
    private String branch;

    @Column(name = "graduation_year")
    private Integer graduationYear;

    @Column(name = "cgpa")
    private Double cgpa;

    // Experience
    @Column(name = "experience_years")
    private Integer experienceYears;

    @Column(name = "current_company")
    private String currentCompany;

    @Column(name = "current_role")
    private String currentRole;

    // Skills (comma separated)
    @Column(columnDefinition = "TEXT")
    private String skills;

    // Social links
    @Column(name = "github_url")
    private String githubUrl;

    @Column(name = "linkedin_url")
    private String linkedinUrl;

    @Column(name = "portfolio_url")
    private String portfolioUrl;

    // Profile picture
    @Column(name = "profile_picture")
    private String profilePicture; // stored filename

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Career Goals
    @Column(name = "target_role_goal")
    private String targetRoleGoal;

    @Column(name = "preferred_companies")
    private String preferredCompanies;

    @Column(name = "preferred_location")
    private String preferredLocation;

    @Column(name = "expected_salary")
    private String expectedSalary;

    @Column(name = "job_type")
    private String jobType; // Full-time / Internship / Remote

    // Extra social links
    @Column(name = "leetcode_url")
    private String leetcodeUrl;

    @Column(name = "codechef_url")
    private String codechefUrl;

    @Column(name = "codeforces_url")
    private String codeforcesUrl;

    @PrePersist
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}




