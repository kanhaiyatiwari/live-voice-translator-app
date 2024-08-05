package com.callingApp.config;

import java.io.IOException;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import com.callingApp.Repository.UserRepository;
import com.callingApp.modle.Message;
import com.callingApp.modle.User;
import com.callingApp.services.TranslationService;
import com.fasterxml.jackson.databind.ObjectMapper;

@Component
public class MessageHandler extends TextWebSocketHandler {
	@Autowired
    private TranslationService translationService; 
    @Autowired
    private UserRepository userRepository;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final ConcurrentMap<String, WebSocketSession> sessions = new ConcurrentHashMap<>();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        System.out.println("Connection established with session ID: " + session.getId());
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        String payload = message.getPayload();
        try {
            
        	
            LoginMessage loginMessage = objectMapper.readValue(payload, LoginMessage.class);
            if ("login".equals(loginMessage.getType())) {
                sessions.put(loginMessage.getUsername(), session);
                return;
            }
        } catch (IOException e) {
            
        	
        	
        	
            try {
                Message chatMessage = objectMapper.readValue(payload, Message.class);
                
                User sender = userRepository.findByUsername(chatMessage.getSender());
                User recipient = userRepository.findByUsername(chatMessage.getRecipient());
                
                if (sender == null || recipient == null) {
                    // Handle case where sender or recipient is not found
                    System.err.println("Sender or recipient not found in database.");
                    return;
                }
                
                String senderLanguage = sender.getNativelanguage();
                String recipientLanguage = recipient.getNativelanguage();
                String cont=chatMessage.getContent();
                if(!senderLanguage.equals(recipientLanguage)&&!
                cont.equals("you have a call")&&!cont.equals("call accepted")&&!cont.equals("Not acepted")&&!cont.equals("call-droped")){
                	
                
                String translatedText = translationService.translate(
                        senderLanguage, chatMessage.getContent(), recipientLanguage
                    );
                chatMessage.setContent(translatedText);
                }
                WebSocketSession recipientSession = sessions.get(chatMessage.getRecipient());
                if (recipientSession != null && recipientSession.isOpen()) {
                    recipientSession.sendMessage(new TextMessage(objectMapper.writeValueAsString(chatMessage)));
                }
            } catch (IOException ex) {
                // Handle as a call message
                CallMessage callMessage = objectMapper.readValue(payload, CallMessage.class);
                WebSocketSession recipientSession = sessions.get(callMessage.getRecipient());
                if (recipientSession != null && recipientSession.isOpen()) {
                    recipientSession.sendMessage(new TextMessage(objectMapper.writeValueAsString(callMessage)));
                }
            }
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        sessions.values().remove(session);
        System.out.println("Connection closed with session ID: " + session.getId());
    }

    private static class LoginMessage {
        private String type;
        private String username;

        // Getters and setters
        public String getType() {
            return type;
        }

        public void setType(String type) {
            this.type = type;
        }

        public String getUsername() {
            return username;
        }

        public void setUsername(String username) {
            this.username = username;
        }
    }

    private static class CallMessage {
        private String type;
        private String sender;
        private String recipient;
        private String content; // Add more fields as needed

        // Getters and setters
        public String getType() {
            return type;
        }

        public void setType(String type) {
            this.type = type;
        }

        public String getSender() {
            return sender;
        }

        public void setSender(String sender) {
            this.sender = sender;
        }

        public String getRecipient() {
            return recipient;
        }

        public void setRecipient(String recipient) {
            this.recipient = recipient;
        }

        public String getContent() {
            return content;
        }

        public void setContent(String content) {
            this.content = content;
        }
    }
}
