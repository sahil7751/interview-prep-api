package com.jobtracker.controller;

import com.jobtracker.dto.response.ApiResponse;
import com.jobtracker.dto.response.NotificationResponse;
import com.jobtracker.service.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
@Tag(name = "Notifications", description = "Notification read and cleanup actions")
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    @Operation(summary = "Get all notifications")
    public ResponseEntity<ApiResponse<List<NotificationResponse>>> getAll() {
        return ResponseEntity.ok(
                ApiResponse.success("Notifications fetched",
                        notificationService.getAll()));
    }

    @GetMapping("/unread")
    @Operation(summary = "Get unread notifications")
    public ResponseEntity<ApiResponse<List<NotificationResponse>>> getUnread() {
        return ResponseEntity.ok(
                ApiResponse.success("Unread notifications",
                        notificationService.getUnread()));
    }

    @GetMapping("/count")
    @Operation(summary = "Get unread notification count")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getCount() {
        long count = notificationService.getUnreadCount();
        return ResponseEntity.ok(
                ApiResponse.success("Unread count",
                        Map.of("unreadCount", count)));
    }

    @PatchMapping("/{id}/read")
    @Operation(summary = "Mark a notification as read")
    public ResponseEntity<ApiResponse<Object>> markAsRead(@PathVariable Long id) {
        notificationService.markAsRead(id);
        return ResponseEntity.ok(
                ApiResponse.success("Marked as read", null));
    }

    @PatchMapping("/read-all")
    @Operation(summary = "Mark all notifications as read")
    public ResponseEntity<ApiResponse<Object>> markAllAsRead() {
        notificationService.markAllAsRead();
        return ResponseEntity.ok(
                ApiResponse.success("All marked as read", null));
    }

    @DeleteMapping("/clear-read")
    @Operation(summary = "Clear all read notifications")
    public ResponseEntity<ApiResponse<Object>> clearRead() {
        notificationService.clearRead();
        return ResponseEntity.ok(
                ApiResponse.success("Read notifications cleared", null));
    }
}
