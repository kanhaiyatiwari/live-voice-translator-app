package com.callingApp.services;

import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class TranslationService {
    
    private final RestTemplate restTemplate;

    @Autowired
    public TranslationService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    public String translate(String sourceLang, String text, String targetLang) {
        // Example URL for translation API
        String url = "http://127.0.0.1:5000/translate";
        
        // Create request body
        Map<String, String> requestBody = new HashMap<>();
        requestBody.put("source", sourceLang);
        requestBody.put("text", text);
        requestBody.put("target", targetLang);
        
        // Make the request
        ResponseEntity<Map> response = restTemplate.postForEntity(url, requestBody, Map.class);
        Map<String, String> responseBody = response.getBody();
        
        return responseBody != null ? responseBody.get("translated_text") : null;
    }
}
