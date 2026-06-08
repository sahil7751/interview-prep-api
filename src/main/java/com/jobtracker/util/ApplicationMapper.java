package com.jobtracker.util;

import com.jobtracker.dto.request.ApplicationRequest;
import com.jobtracker.dto.response.ApplicationResponse;
import com.jobtracker.entity.Application;
import com.jobtracker.entity.User;

public class ApplicationMapper {

    public static Application toEntity(ApplicationRequest request, User user) {
        return Application.builder()
                .user(user)
                .companyName(request.getCompanyName())
                .jobRole(request.getJobRole())
                .packageCtc(request.getPackageCtc())
                .location(request.getLocation())
                .applicationDate(request.getApplicationDate())
                .status(request.getStatus())
                .jobDescription(request.getJobDescription())
                .applicationLink(request.getApplicationLink())
                .notes(request.getNotes())
                .build();
    }

    public static ApplicationResponse toResponse(Application app) {
        return ApplicationResponse.builder()
                .id(app.getId())
                .companyName(app.getCompanyName())
                .jobRole(app.getJobRole())
                .packageCtc(app.getPackageCtc())
                .location(app.getLocation())
                .applicationDate(app.getApplicationDate())
                .status(app.getStatus())
                .jobDescription(app.getJobDescription())
                .applicationLink(app.getApplicationLink())
                .notes(app.getNotes())
                .lastUpdated(app.getLastUpdated())
                .createdAt(app.getCreatedAt())
                .build();
    }

    public static void updateEntity(Application app, ApplicationRequest request) {
        app.setCompanyName(request.getCompanyName());
        app.setJobRole(request.getJobRole());
        app.setPackageCtc(request.getPackageCtc());
        app.setLocation(request.getLocation());
        app.setApplicationDate(request.getApplicationDate());
        app.setStatus(request.getStatus());
        app.setJobDescription(request.getJobDescription());
        app.setApplicationLink(request.getApplicationLink());
        app.setNotes(request.getNotes());
    }
}
