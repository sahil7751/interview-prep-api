package com.jobtracker.repository;

import com.jobtracker.entity.User;
import com.jobtracker.entity.XpTransaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface XpTransactionRepository
        extends JpaRepository<XpTransaction, Long> {

    Page<XpTransaction> findByUserOrderByCreatedAtDesc(
            User user, Pageable pageable);

    List<XpTransaction> findTop10ByUserOrderByCreatedAtDesc(
            User user);
}


