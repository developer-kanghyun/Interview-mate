package com.interviewmate.conversation.repository;

import com.interviewmate.entity.Conversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConversationRepository extends JpaRepository<Conversation, Long> {
    List<Conversation> findByUser_IdOrderByUpdatedAtDesc(Long userId);

    Optional<Conversation> findByIdAndUser_Id(Long id, Long userId);

    @Modifying
    @Query(value = "UPDATE conversations SET user_id = :targetUserId WHERE user_id = :sourceUserId", nativeQuery = true)
    int reassignUserConversations(@Param("sourceUserId") Long sourceUserId, @Param("targetUserId") Long targetUserId);
}
