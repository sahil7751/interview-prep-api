package com.jobtracker.repository;

import com.jobtracker.entity.Application;
import com.jobtracker.entity.Notification;
import com.jobtracker.entity.NotificationType;
import com.jobtracker.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findByUserOrderByCreatedAtDesc(User user);

    List<Notification> findByUserAndIsReadFalseOrderByCreatedAtDesc(User user);

    long countByUserAndIsReadFalse(User user);

    Optional<Notification> findByIdAndUser(Long id, User user);

    boolean existsByUserAndApplicationAndType(User user,
                                              Application application,
                                              NotificationType type);

    @Query("""
            SELECT n FROM Notification n
            WHERE n.isSent = false
            AND n.remindAt <= :now
            """)
    List<Notification> findUnsentDueNotifications(@Param("now") LocalDateTime now);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE Notification n SET n.isRead = true WHERE n.user = :user")
    void markAllAsRead(@Param("user") User user);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
            DELETE FROM Notification n
            WHERE n.user = :user AND n.isRead = true
            """)
    void deleteReadNotifications(@Param("user") User user);
}
