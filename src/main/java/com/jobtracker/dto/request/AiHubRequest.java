package com.jobtracker.dto.request;

import lombok.Getter;
import lombok.Setter;
import java.util.List;

@Getter
@Setter
public class AiHubRequest {
    private String mode; // resume_analysis, ats, skill_gap,
                         // company_prep, questions, roadmap,
                         // placement_prep, chat
    private String resumeText;
    private String jobDescription;
    private String targetRole;
    private String targetCompany;
    private String experienceLevel;
    private String currentSkills;
    private String interviewType;
    private String difficulty;
    private int questionCount = 5;
    private boolean useActiveResume = false;
    private List<ChatMessage> chatMessages;

    @Getter
    @Setter
    public static class ChatMessage {
        private String role;
        private String content;
    }
}
