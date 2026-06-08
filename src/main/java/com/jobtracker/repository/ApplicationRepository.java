package com.jobtracker.repository;

import com.jobtracker.entity.Application;
import com.jobtracker.entity.ApplicationStatus;
import com.jobtracker.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ApplicationRepository extends JpaRepository<Application, Long> {

    // Find all applications for a user (paginated)
    Page<Application> findByUser(User user, Pageable pageable);

    // Find by user and status
    Page<Application> findByUserAndStatus(User user, ApplicationStatus status, Pageable pageable);

    // Search by company name or job role (case-insensitive)
    @Query("""
                SELECT a FROM Application a
                WHERE a.user = :user
                AND (LOWER(a.companyName) LIKE LOWER(CONCAT('%', :keyword, '%'))
                OR LOWER(a.jobRole) LIKE LOWER(CONCAT('%', :keyword, '%')))
            """)
    Page<Application> searchByKeyword(@Param("user") User user,
            @Param("keyword") String keyword,
            Pageable pageable);

    // Search + filter by status
    @Query("""
                SELECT a FROM Application a
                WHERE a.user = :user
                AND a.status = :status
                AND (LOWER(a.companyName) LIKE LOWER(CONCAT('%', :keyword, '%'))
                OR LOWER(a.jobRole) LIKE LOWER(CONCAT('%', :keyword, '%')))
            """)
    Page<Application> searchByKeywordAndStatus(@Param("user") User user,
            @Param("keyword") String keyword,
            @Param("status") ApplicationStatus status,
            Pageable pageable);

    // Dashboard counts
    long countByUser(User user);

    long countByUserAndStatus(User user, ApplicationStatus status);

    // All applications for a user (no pagination — for analytics)
    List<Application> findByUser(User user);

    // Find by id AND user (prevents accessing other users' data)
    Optional<Application> findByIdAndUser(Long id, User user);
}

