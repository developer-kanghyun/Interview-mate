package com.interviewmate.repository;

import com.interviewmate.entity.InterviewSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface InterviewSessionRepository extends JpaRepository<InterviewSession, Long> {
    Optional<InterviewSession> findByIdAndUser_Id(Long sessionId, Long userId);
    Optional<InterviewSession> findFirstByUser_IdAndStatusOrderByUpdatedAtDesc(Long userId, String status);

    @Modifying
    @Query(value = "UPDATE interview_sessions SET user_id = :targetUserId WHERE user_id = :sourceUserId", nativeQuery = true)
    int reassignUserSessions(@Param("sourceUserId") Long sourceUserId, @Param("targetUserId") Long targetUserId);
}
