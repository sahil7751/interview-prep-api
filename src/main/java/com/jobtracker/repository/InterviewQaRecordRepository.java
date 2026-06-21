package com.jobtracker.repository;

import com.jobtracker.entity.InterviewPracticeSession;
import com.jobtracker.entity.InterviewQaRecord;
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
public interface InterviewQaRecordRepository
        extends JpaRepository<InterviewQaRecord, Long> {

    List<InterviewQaRecord> findBySessionOrderByCreatedAtAsc(
            InterviewPracticeSession session);

    Page<InterviewQaRecord> findByUserAndIsEvaluatedTrue(
            User user, Pageable pageable);

    Optional<InterviewQaRecord> findByIdAndUser(Long id, User user);

    long countByUserAndIsEvaluatedTrue(User user);

    @Query("""
            SELECT AVG(q.aiScore)
            FROM InterviewQaRecord q
            WHERE q.user = :user
            AND q.isEvaluated = true
            """)
    Double findAverageScoreByUser(@Param("user") User user);
}


