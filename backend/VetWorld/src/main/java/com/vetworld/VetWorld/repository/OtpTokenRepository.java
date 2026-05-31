package com.vetworld.VetWorld.repository;

import com.vetworld.VetWorld.model.OtpToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;

@Repository
public interface OtpTokenRepository extends JpaRepository<OtpToken, String> {

    boolean existsByEmailAndExpiresAtAfter(String email, LocalDateTime now);
}
