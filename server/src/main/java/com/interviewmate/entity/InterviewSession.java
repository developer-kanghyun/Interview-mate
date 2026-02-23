package com.interviewmate.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "interview_sessions")
@Getter
@Setter
@NoArgsConstructor
public class InterviewSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "job_role", nullable = false, length = 20)
    private String jobRole;

    @Column(name = "interviewer_character", nullable = false, length = 20)
    private String interviewerCharacter;

    @Column(name = "interviewer_pressure_count", nullable = false, columnDefinition = "integer default 0")
    private int interviewerPressureCount;

    @Column(name = "total_questions", nullable = false)
    private int totalQuestions;

    @Column(name = "status", nullable = false, length = 30)
    private String status;

    @Column(name = "end_reason", length = 50)
    private String endReason;

    @Column(name = "started_at", nullable = false)
    private LocalDateTime startedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public InterviewSession(User user, String jobRole, String interviewerCharacter, int totalQuestions, String status) {
        this.user = user;
        this.jobRole = jobRole;
        this.interviewerCharacter = interviewerCharacter;
        this.interviewerPressureCount = 0;
        this.totalQuestions = totalQuestions;
        this.status = status;
        this.startedAt = LocalDateTime.now();
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (startedAt == null) {
            startedAt = LocalDateTime.now();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
