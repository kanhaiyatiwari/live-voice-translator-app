package com.callingApp.Repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.callingApp.modle.Message;

public interface MessageRepository extends JpaRepository<Message, Long> {
}
