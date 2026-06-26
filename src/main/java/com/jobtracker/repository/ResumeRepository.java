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
public interface ResumeRepository
        extends JpaRepository<Resume, Long> {

    List<Resume> findByUserOrderByVersionNumberDesc(User user);

    Optional<Resume> findByIdAndUser(Long id, User user);

    @Query("SELECT COALESCE(MAX(r.versionNumber), 0) "
        + "FROM Resume r WHERE r.user = :user")
    Integer findMaxVersionByUser(@Param("user") User user);

    Optional<Resume> findByUserAndIsActiveTrue(User user);

    @Modifying
    @Query("UPDATE Resume r SET r.isActive = false "
         + "WHERE r.user = :user")
    void deactivateAllForUser(@Param("user") User user);

    long countByUser(User user);

    // ── New queries ───────────────────────────────────────────
    List<Resume> findByUserAndRoleTagOrderByVersionNumberDesc(
            User user, String roleTag);

    @Query("SELECT DISTINCT r.roleTag FROM Resume r "
         + "WHERE r.user = :user AND r.roleTag IS NOT NULL")
    List<String> findDistinctRoleTagsByUser(
            @Param("user") User user);
}

