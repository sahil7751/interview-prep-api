package com.jobtracker.repository;

import com.jobtracker.entity.User;
import com.jobtracker.entity.UserGamification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserGamificationRepository
        extends JpaRepository<UserGamification, Long> {

    Optional<UserGamification> findByUser(User user);
}

