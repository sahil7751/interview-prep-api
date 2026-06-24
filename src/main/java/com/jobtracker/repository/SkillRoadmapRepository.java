package com.jobtracker.repository;

import com.jobtracker.entity.SkillRoadmap;
import com.jobtracker.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SkillRoadmapRepository
        extends JpaRepository<SkillRoadmap, Long> {

    List<SkillRoadmap> findByUserOrderByCreatedAtDesc(User user);

    Optional<SkillRoadmap> findByIdAndUser(Long id, User user);

    long countByUser(User user);
}
