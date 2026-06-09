package com.jobtracker.repository;

import com.jobtracker.entity.Interview;
import com.jobtracker.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface InterviewRepository extends JpaRepository<Interview, Long> {

    // All interviews for a user (paginated)
    Page<Interview> findByUserOrderByInterviewDateDesc(User user,
            Pageable pageable);

    // Search by company name
    @Query("""
            SELECT i FROM Interview i
            WHERE i.user = :user
            AND LOWER(i.companyName) LIKE LOWER(CONCAT('%', :keyword, '%'))
            """)
    Page<Interview> searchByCompany(@Param("user") User user,
            @Param("keyword") String keyword,
            Pageable pageable);

    // All interviews linked to a specific application
    Page<Interview> findByUserAndApplicationId(User user,
            Long applicationId,
            Pageable pageable);

    // Secure single fetch
    Optional<Interview> findByIdAndUser(Long id, User user);

    // Count for dashboard
    long countByUser(User user);
}

