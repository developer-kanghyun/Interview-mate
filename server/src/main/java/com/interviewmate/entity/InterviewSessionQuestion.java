package com.interviewmate.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "interview_session_questions")
@Getter
@Setter
@NoArgsConstructor
public class InterviewSessionQuestion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false)
    private InterviewSession session;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    private InterviewQuestion question;

    @Column(name = "question_order", nullable = false)
    private int questionOrder;

    @Column(name = "followup_count", nullable = false)
    private int followupCount;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public InterviewSessionQuestion(InterviewSession session, InterviewQuestion question, int questionOrder) {
        this.session = session;
        this.question = question;
        this.questionOrder = questionOrder;
        this.followupCount = 0;
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (followupCount < 0) {
            followupCount = 0;
        }
    }

    public void incrementFollowupCount() {
        followupCount += 1;
    }
}
