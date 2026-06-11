package com.jobtracker.service;

import com.jobtracker.dto.response.NotificationResponse;
import com.jobtracker.entity.Application;
import com.jobtracker.entity.Notification;
import com.jobtracker.entity.NotificationType;
import com.jobtracker.entity.User;
import com.jobtracker.repository.NotificationRepository;
import com.jobtracker.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final SecurityUtils securityUtils;

    @Transactional(readOnly = true)
    public List<NotificationResponse> getAll() {
        User user = securityUtils.getCurrentUser();
        return notificationRepository.findByUserOrderByCreatedAtDesc(user)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<NotificationResponse> getUnread() {
        User user = securityUtils.getCurrentUser();
        return notificationRepository.findByUserAndIsReadFalseOrderByCreatedAtDesc(user)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public long getUnreadCount() {
        User user = securityUtils.getCurrentUser();
        return notificationRepository.countByUserAndIsReadFalse(user);
    }

    @Transactional
    public void markAsRead(Long id) {
        User user = securityUtils.getCurrentUser();
        Notification notification = notificationRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new RuntimeException("Notification not found"));
        notification.setIsRead(true);
        notificationRepository.save(notification);
    }

    @Transactional
    public void markAllAsRead() {
        User user = securityUtils.getCurrentUser();
        notificationRepository.markAllAsRead(user);
    }

    @Transactional
    public void clearRead() {
        User user = securityUtils.getCurrentUser();
        notificationRepository.deleteReadNotifications(user);
    }

    @Transactional
    public void createNotification(User user,
                                   Application application,
                                   NotificationType type,
                                   String title,
                                   String message,
                                   LocalDateTime remindAt) {
        Notification notification = Notification.builder()
                .user(user)
                .application(application)
                .type(type)
                .title(title)
                .message(message)
                .remindAt(remindAt)
                .build();
        notificationRepository.save(notification);
    }

    private NotificationResponse toResponse(Notification notification) {
        return NotificationResponse.builder()
                .id(notification.getId())
                .title(notification.getTitle())
                .message(notification.getMessage())
                .type(notification.getType())
                .isRead(notification.getIsRead())
                .remindAt(notification.getRemindAt())
                .createdAt(notification.getCreatedAt())
                .applicationId(notification.getApplication() != null
                        ? notification.getApplication().getId() : null)
                .companyName(notification.getApplication() != null
                        ? notification.getApplication().getCompanyName() : null)
                .build();
    }
}
