package com.jobtracker.repository;

import com.jobtracker.entity.Resume;
import com.jobtracker.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ResumeRepository extends JpaRepository<Resume, Long> {

    // All resumes for a user, newest first
    List<Resume> findByUserOrderByVersionNumberDesc(User user);

    // Secure single fetch
    Optional<Resume> findByIdAndUser(Long id, User user);

    // Get current max version for a user
    @Query("SELECT COALESCE(MAX(r.versionNumber), 0) FROM Resume r WHERE r.user = :user")
    Integer findMaxVersionByUser(@Param("user") User user);

    // Get currently active resume
    Optional<Resume> findByUserAndIsActiveTrue(User user);

    // Deactivate all resumes for a user (before setting a new active one)
    @Modifying
    @Query("UPDATE Resume r SET r.isActive = false WHERE r.user = :user")
    void deactivateAllForUser(@Param("user") User user);

    // Count resumes for a user
    long countByUser(User user);
}
