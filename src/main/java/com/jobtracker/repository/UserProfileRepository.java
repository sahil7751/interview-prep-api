package com.jobtracker.repository;

import com.jobtracker.entity.UserProfile;
import com.jobtracker.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserProfileRepository
        extends JpaRepository<UserProfile, Long> {

    Optional<UserProfile> findByUser(User user);

    boolean existsByUsername(String username);

    boolean existsByUsernameAndUserNot(String username, User user);
}
