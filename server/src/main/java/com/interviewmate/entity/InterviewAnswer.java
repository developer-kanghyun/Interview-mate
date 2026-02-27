package com.interviewmate.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "interview_answers")
@Getter
@Setter
@NoArgsConstructor
public class InterviewAnswer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_question_id", nullable = false)
    private InterviewSessionQuestion sessionQuestion;

    @Column(name = "answer_text", nullable = false, columnDefinition = "TEXT")
    private String answerText;

    @Column(name = "input_type", nullable = false, length = 20)
    private String inputType;

    @Column(name = "interviewer_emotion", nullable = false, length = 20, columnDefinition = "varchar(20) default 'neutral'")
    private String interviewerEmotion;

    @Column(name = "score_accuracy")
    private Double scoreAccuracy;

    @Column(name = "score_logic")
    private Double scoreLogic;

    @Column(name = "score_depth")
    private Double scoreDepth;

    @Column(name = "score_delivery")
    private Double scoreDelivery;

    @Column(name = "score_total")
    private Double scoreTotal;

    @Column(name = "followup_required")
    private Boolean followupRequired;

    @Column(name = "followup_reason", columnDefinition = "TEXT")
    private String followupReason;

    @Column(name = "coaching_message", length = 400)
    private String coachingMessage;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public InterviewAnswer(InterviewSessionQuestion sessionQuestion, String answerText, String inputType, String interviewerEmotion) {
        this.sessionQuestion = sessionQuestion;
        this.answerText = answerText;
        this.inputType = inputType;
        this.interviewerEmotion = interviewerEmotion;
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
