package com.jobtracker.dto.response;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PracticeQuestionResponse {
    private Long id;
    private String question;
    private String difficulty;
    private String category;
    private boolean evaluated;
    private Double score;
}


