package com.interviewmate.repository;

import com.interviewmate.entity.InterviewAnswer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface InterviewAnswerRepository extends JpaRepository<InterviewAnswer, Long> {
    List<InterviewAnswer> findBySessionQuestion_Session_IdOrderByCreatedAtAsc(Long sessionId);
    List<InterviewAnswer> findBySessionQuestion_Session_User_IdAndCreatedAtAfterOrderByCreatedAtDesc(Long userId, LocalDateTime createdAt);
    long countBySessionQuestion_Id(Long sessionQuestionId);
}
