package com.jobtracker.entity;

import lombok.Getter;

@Getter
public enum XpAction {

    DAILY_CHECKIN("Daily Check-in", 5),
    GENERATE_QUESTIONS("Generated Interview Questions", 2),
    RESUME_ANALYSIS("Resume Analysis", 10),
    SKILL_GAP_ANALYSIS("Skill Gap Analysis", 10),
    ANSWER_QUESTION("Answered a Question", 5),
    PROFILE_COMPLETED("Completed Profile", 20);

    private final String description;
    private final int xpPoints;

    XpAction(String description, int xpPoints) {
        this.description = description;
        this.xpPoints = xpPoints;
    }
}