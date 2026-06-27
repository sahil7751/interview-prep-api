package com.jobtracker.entity;

import lombok.Getter;

@Getter
public enum XpAction {

    DAILY_CHECKIN("Daily Activity Bonus", 5),
    GENERATE_QUESTIONS("Generated Interview Questions", 2),
    RESUME_ANALYSIS("Resume Analysis", 10),
    SKILL_GAP_ANALYSIS("Skill Gap Analysis", 10),
    ANSWER_QUESTION("Answered a Question", 5),
    PROFILE_COMPLETED("Completed Profile", 20),
    ADD_APPLICATION("Added Job Application", 10),
    SCHEDULE_INTERVIEW("Scheduled Interview", 5),
    UPLOAD_RESUME("Uploaded Resume", 15),
    GENERATE_RESUME("Generated Resume with AI", 15),
    ATS_SCAN("ATS Resume Scan", 10),
    RESUME_COMPARISON("Resume Comparison", 5),
    CAREER_COACH_CHAT("Career Coach Interaction", 3),
    COMPLETE_ROADMAP_ITEM("Completed Roadmap Milestone", 5);

    private final String description;
    private final int xpPoints;

    XpAction(String description, int xpPoints) {
        this.description = description;
        this.xpPoints = xpPoints;
    }
}