package com.jobtracker.dto.response;

import lombok.*;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InterviewQuestionsResponse {

    private String jobRole;
    private List<QuestionItem> technicalQuestions;
    private List<QuestionItem> behaviouralQuestions;
    private List<QuestionItem> hrQuestions;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class QuestionItem {
        private String question;
        private String hint; // brief answer hint
        private String difficulty; // Easy / Medium / Hard
    }
}
