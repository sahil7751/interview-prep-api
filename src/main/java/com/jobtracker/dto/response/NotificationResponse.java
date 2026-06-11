package com.jobtracker.dto.response;

import com.jobtracker.entity.NotificationType;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationResponse {
    private Long id;
    private String title;
    private String message;
    private NotificationType type;
    private Boolean isRead;
    private LocalDateTime remindAt;
    private LocalDateTime createdAt;
    private Long applicationId;
    private String companyName;
}
