package com.jobtracker.repository;

import com.jobtracker.entity.RoadmapMilestone;
import com.jobtracker.entity.SkillRoadmap;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RoadmapMilestoneRepository
        extends JpaRepository<RoadmapMilestone, Long> {

    List<RoadmapMilestone> findByRoadmapOrderByWeekNumberAscOrderIndexAsc(
            SkillRoadmap roadmap);

    Optional<RoadmapMilestone> findByIdAndRoadmap(
            Long id, SkillRoadmap roadmap);

    long countByRoadmapAndIsCompletedTrue(SkillRoadmap roadmap);
}

