package com.vetworld.VetWorld.repository;

import com.vetworld.VetWorld.model.PasswordResetToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {

    /** Counts unexpired tokens for a user — used to enforce the per-window rate limit. */
    long countByUserIdAndExpiresAtAfter(Long userId, LocalDateTime now);

    /** Finds a usable (unused, unexpired) token matching the submitted hash. */
    Optional<PasswordResetToken> findByUserIdAndTokenHashAndUsedFalseAndExpiresAtAfter(
            Long userId, String tokenHash, LocalDateTime now);
}
