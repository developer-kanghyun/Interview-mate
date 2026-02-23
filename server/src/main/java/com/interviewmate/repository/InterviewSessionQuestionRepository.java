package com.interviewmate.repository;

import com.interviewmate.entity.InterviewSessionQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InterviewSessionQuestionRepository extends JpaRepository<InterviewSessionQuestion, Long> {
    Optional<InterviewSessionQuestion> findBySession_IdAndQuestion_Id(Long sessionId, Long questionId);
    Optional<InterviewSessionQuestion> findFirstBySession_IdAndQuestionOrderGreaterThanOrderByQuestionOrderAsc(Long sessionId, int questionOrder);
    List<InterviewSessionQuestion> findBySession_IdOrderByQuestionOrderAsc(Long sessionId);
}
