package com.jobtracker.dto.request;

import jakarta.validation.constraints.NotEmpty;
import lombok.Getter;
import lombok.Setter;
import java.util.List;

@Getter
@Setter
public class CareerCoachRequest {

    @NotEmpty(message = "Messages cannot be empty")
    private List<ChatMessage> messages;

    private String context; // optional: user's profile summary

    @Getter
    @Setter
    public static class ChatMessage {
        private String role; // "user" or "assistant"
        private String content;
    }
}

