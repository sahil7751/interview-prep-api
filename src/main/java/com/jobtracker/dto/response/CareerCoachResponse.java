package com.jobtracker.dto.response;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CareerCoachResponse {
    private String message;
    private String role; // always "assistant"
    private int tokensUsed;
}

