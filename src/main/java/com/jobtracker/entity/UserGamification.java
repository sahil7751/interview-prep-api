package com.jobtracker.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_gamification")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserGamification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(name = "total_xp")
    private int totalXp;

    @Column(name = "current_level")
    private String currentLevel;

    @Column(name = "current_streak")
    private int currentStreak;

    @Column(name = "longest_streak")
    private int longestStreak;

    @Column(name = "last_checkin_date")
    private LocalDate lastCheckinDate;

    @Column(name = "total_checkins")
    private int totalCheckins;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        totalXp = 0;
        currentStreak = 0;
        longestStreak = 0;
        totalCheckins = 0;
        currentLevel = "Beginner";
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}


