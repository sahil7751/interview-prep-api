package com.jobtracker.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jobtracker.exception.GroqServiceException;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import lombok.extern.slf4j.Slf4j;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.net.SocketTimeoutException;

@Service
@Slf4j
@RequiredArgsConstructor
public class GroqService {

    @Value("${groq.api.key}")
    private String apiKey;

    @Value("${groq.api.url}")
    private String apiUrl;

    @Value("${groq.api.model}")
    private String model;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public String generateContent(String prompt) {

        if (prompt == null || prompt.isBlank()) {
            throw new GroqServiceException(HttpStatus.BAD_REQUEST, "Prompt cannot be empty");
        }

        if (apiKey == null || apiKey.isBlank()) {
            throw new GroqServiceException(HttpStatus.UNAUTHORIZED,
                    "Groq API key is not configured. Set GROQ_API_KEY before calling AI endpoints.");
        }

        log.debug("Calling Groq model {} via {}", model, apiUrl);
        log.debug("Groq prompt length: {} characters", prompt.length());

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(apiKey);
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> request = new HashMap<>();

        request.put("model", model);
        request.put("temperature", 0.2);

        request.put("messages", List.of(
                Map.of(
                        "role", "user",
                        "content", prompt)));
        request.put("stream", false);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(request, headers);

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(
                    apiUrl,
                    entity,
                    String.class);

            log.debug("Groq response status: {}", response.getStatusCode());

            String body = response.getBody();
            if (body == null || body.isBlank()) {
                throw new GroqServiceException(HttpStatus.BAD_GATEWAY, "Groq returned an empty response");
            }

            JsonNode root = objectMapper.readTree(body);
            JsonNode choices = root.path("choices");

            if (!choices.isArray() || choices.isEmpty()) {
                throw new GroqServiceException(HttpStatus.BAD_GATEWAY, "Groq response missing choices");
            }

            JsonNode message = choices.get(0).path("message");
            JsonNode content = message.path("content");

            if (content.isMissingNode() || content.isNull() || content.asText().isBlank()) {
                throw new GroqServiceException(HttpStatus.BAD_GATEWAY, "Groq response missing message content");
            }

            String generatedContent = content.asText();
            log.debug("Groq response content length: {} characters", generatedContent.length());
            return generatedContent;

        } catch (HttpStatusCodeException ex) {
            throw mapHttpException(ex);
        } catch (ResourceAccessException ex) {
            throw mapResourceAccessException(ex);
        } catch (GroqServiceException ex) {
            throw ex;
        } catch (Exception ex) {
            log.error("Unexpected Groq client error", ex);
            throw new GroqServiceException(HttpStatus.BAD_GATEWAY, "Failed to process Groq response", ex);
        }
    }

    private GroqServiceException mapHttpException(HttpStatusCodeException ex) {
        HttpStatus status = HttpStatus.resolve(ex.getStatusCode().value());
        String responseBody = ex.getResponseBodyAsString();
        log.warn("Groq API error {}: {}", ex.getStatusCode(), responseBody);

        if (status == HttpStatus.UNAUTHORIZED || status == HttpStatus.FORBIDDEN) {
            return new GroqServiceException(HttpStatus.UNAUTHORIZED,
                    "Groq authentication failed. Check GROQ_API_KEY.", ex);
        }

        if (status == HttpStatus.TOO_MANY_REQUESTS) {
            return new GroqServiceException(HttpStatus.TOO_MANY_REQUESTS,
                    "Groq rate limit exceeded. Please retry later.", ex);
        }

        if (status != null && status.is4xxClientError()) {
            return new GroqServiceException(HttpStatus.BAD_REQUEST,
                    "Groq rejected the request: " + safeGroqErrorMessage(responseBody), ex);
        }

        if (status != null && status.is5xxServerError()) {
            return new GroqServiceException(HttpStatus.BAD_GATEWAY,
                    "Groq service is temporarily unavailable.", ex);
        }

        return new GroqServiceException(HttpStatus.BAD_GATEWAY,
                "Groq request failed with status " + ex.getStatusCode(), ex);
    }

    private GroqServiceException mapResourceAccessException(ResourceAccessException ex) {
        Throwable cause = ex.getCause();
        boolean timedOut = cause instanceof SocketTimeoutException
                || (cause != null && cause.getMessage() != null && cause.getMessage().toLowerCase().contains("timed out"));

        if (timedOut) {
            log.warn("Groq request timed out");
            return new GroqServiceException(HttpStatus.GATEWAY_TIMEOUT,
                    "Groq request timed out. Please retry.", ex);
        }

        log.warn("Groq request could not reach upstream service: {}", ex.getMessage());
        return new GroqServiceException(HttpStatus.SERVICE_UNAVAILABLE,
                "Unable to reach the Groq service.", ex);
    }

    private String safeGroqErrorMessage(String responseBody) {
        if (responseBody == null || responseBody.isBlank()) {
            return "Unknown Groq error";
        }

        try {
            JsonNode root = objectMapper.readTree(responseBody);
            JsonNode error = root.path("error");
            if (error.isMissingNode() || error.isNull()) {
                return responseBody;
            }

            String message = error.path("message").asText("");
            String type = error.path("type").asText("");
            if (!message.isBlank() && !type.isBlank()) {
                return type + ": " + message;
            }
            if (!message.isBlank()) {
                return message;
            }
        } catch (Exception ignored) {
            // Fall through to raw body below.
        }

        return responseBody;
    }
}



