package com.jobtracker.repository;

import com.jobtracker.entity.InterviewPracticeSession;
import com.jobtracker.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface InterviewPracticeSessionRepository
        extends JpaRepository<InterviewPracticeSession, Long> {

    Page<InterviewPracticeSession> findByUserOrderByCreatedAtDesc(User user, Pageable pageable);

    Optional<InterviewPracticeSession> findByIdAndUser(Long id, User user);

    long countByUser(User user);
}

