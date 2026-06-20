package com.jobtracker.dto.response;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CheckinResponse {

    private boolean alreadyCheckedIn;
    private int xpEarned;
    private int totalXp;
    private int currentStreak;
    private String currentLevel;
    private String message;
}

