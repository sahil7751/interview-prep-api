package com.jobtracker.service;

import com.jobtracker.exception.GroqServiceException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class GroqServiceTest {

    @Mock
    private RestTemplate restTemplate;

    @InjectMocks
    private GroqService groqService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(groqService, "apiKey", "test-api-key");
        ReflectionTestUtils.setField(groqService, "apiUrl", "http://test-api-url");
        ReflectionTestUtils.setField(groqService, "model", "test-model");
    }

    @Test
    void nullPromptThrowsException() {
        GroqServiceException exception = assertThrows(
                GroqServiceException.class,
                () -> groqService.generateContent(null)
        );

        assertEquals("Prompt cannot be empty", exception.getMessage());
        verifyNoHttpCall();
    }

    @Test
    void blankPromptThrowsException() {
        GroqServiceException exception = assertThrows(
                GroqServiceException.class,
                () -> groqService.generateContent("   ")
        );

        assertEquals("Prompt cannot be empty", exception.getMessage());
        verifyNoHttpCall();
    }

    @Test
    void blankApiKeyThrowsExceptionAndDoesNotCallGroq() {
        ReflectionTestUtils.setField(groqService, "apiKey", "");

        GroqServiceException exception = assertThrows(
                GroqServiceException.class,
                () -> groqService.generateContent("test prompt")
        );

        assertEquals(
                "Groq API key is not configured. Set GROQ_API_KEY before calling AI endpoints.",
                exception.getMessage()
        );

        verifyNoHttpCall();
    }

    @Test
    void successfulResponseReturnsContent() {
        String body = """
                {
                  "choices": [
                    {
                      "message": {
                        "content": "test content"
                      }
                    }
                  ]
                }
                """;

        when(restTemplate.postForEntity(
                eq("http://test-api-url"),
                any(),
                eq(String.class)
        )).thenReturn(ResponseEntity.ok(body));

        String result = groqService.generateContent("test prompt");

        assertEquals("test content", result);

        verify(restTemplate, times(1)).postForEntity(
                eq("http://test-api-url"),
                any(),
                eq(String.class)
        );
    }

    @Test
    void http429RetriesAndThenSucceeds() {
        String body = """
                {
                  "choices": [
                    {
                      "message": {
                        "content": "success after retry"
                      }
                    }
                  ]
                }
                """;

        HttpClientErrorException rateLimitException =
                HttpClientErrorException.create(
                        HttpStatus.TOO_MANY_REQUESTS,
                        "Too Many Requests",
                        null,
                        null,
                        null
                );

        when(restTemplate.postForEntity(
                eq("http://test-api-url"),
                any(),
                eq(String.class)
        ))
                .thenThrow(rateLimitException)
                .thenReturn(ResponseEntity.ok(body));

        String result = groqService.generateContent("test prompt");

        assertEquals("success after retry", result);

        verify(restTemplate, times(2)).postForEntity(
                eq("http://test-api-url"),
                any(),
                eq(String.class)
        );
    }

    @Test
    void http503RetriesAndThenSucceeds() {
        String body = """
                {
                  "choices": [
                    {
                      "message": {
                        "content": "success after retry"
                      }
                    }
                  ]
                }
                """;

        HttpServerErrorException serviceUnavailableException =
                HttpServerErrorException.create(
                        HttpStatus.SERVICE_UNAVAILABLE,
                        "Service Unavailable",
                        null,
                        null,
                        null
                );

        when(restTemplate.postForEntity(
                eq("http://test-api-url"),
                any(),
                eq(String.class)
        ))
                .thenThrow(serviceUnavailableException)
                .thenReturn(ResponseEntity.ok(body));

        String result = groqService.generateContent("test prompt");

        assertEquals("success after retry", result);

        verify(restTemplate, times(2)).postForEntity(
                eq("http://test-api-url"),
                any(),
                eq(String.class)
        );
    }

    @Test
    void http429ExhaustsAllThreeAttempts() {
        HttpClientErrorException rateLimitException =
                HttpClientErrorException.create(
                        HttpStatus.TOO_MANY_REQUESTS,
                        "Too Many Requests",
                        null,
                        null,
                        null
                );

        when(restTemplate.postForEntity(
                eq("http://test-api-url"),
                any(),
                eq(String.class)
        )).thenThrow(rateLimitException);

        assertThrows(
                GroqServiceException.class,
                () -> groqService.generateContent("test prompt")
        );

        verify(restTemplate, times(3)).postForEntity(
                eq("http://test-api-url"),
                any(),
                eq(String.class)
        );
    }

    @Test
    void http400DoesNotRetry() {
        HttpClientErrorException badRequestException =
                HttpClientErrorException.create(
                        HttpStatus.BAD_REQUEST,
                        "Bad Request",
                        null,
                        null,
                        null
                );

        when(restTemplate.postForEntity(
                eq("http://test-api-url"),
                any(),
                eq(String.class)
        )).thenThrow(badRequestException);

        assertThrows(
                GroqServiceException.class,
                () -> groqService.generateContent("test prompt")
        );

        verify(restTemplate, times(1)).postForEntity(
                eq("http://test-api-url"),
                any(),
                eq(String.class)
        );
    }

    @Test
    void http401DoesNotRetry() {
        HttpClientErrorException unauthorizedException =
                HttpClientErrorException.create(
                        HttpStatus.UNAUTHORIZED,
                        "Unauthorized",
                        null,
                        null,
                        null
                );

        when(restTemplate.postForEntity(
                eq("http://test-api-url"),
                any(),
                eq(String.class)
        )).thenThrow(unauthorizedException);

        assertThrows(
                GroqServiceException.class,
                () -> groqService.generateContent("test prompt")
        );

        verify(restTemplate, times(1)).postForEntity(
                eq("http://test-api-url"),
                any(),
                eq(String.class)
        );
    }

    @Test
    void resourceAccessExceptionRetriesThreeTimesAndThenFails() {
        ResourceAccessException exception =
                new ResourceAccessException("Connection failed");

        when(restTemplate.postForEntity(
                eq("http://test-api-url"),
                any(),
                eq(String.class)
        )).thenThrow(exception);

        assertThrows(
                GroqServiceException.class,
                () -> groqService.generateContent("test prompt")
        );

        verify(restTemplate, times(3)).postForEntity(
                eq("http://test-api-url"),
                any(),
                eq(String.class)
        );
    }

    @Test
    void emptyResponseBodyThrowsWithoutRetry() {
        when(restTemplate.postForEntity(
                eq("http://test-api-url"),
                any(),
                eq(String.class)
        )).thenReturn(ResponseEntity.ok(""));

        assertThrows(
                GroqServiceException.class,
                () -> groqService.generateContent("test prompt")
        );

        verify(restTemplate, times(1)).postForEntity(
                eq("http://test-api-url"),
                any(),
                eq(String.class)
        );
    }

    @Test
    void missingChoicesThrowsWithoutRetry() {
        when(restTemplate.postForEntity(
                eq("http://test-api-url"),
                any(),
                eq(String.class)
        )).thenReturn(ResponseEntity.ok("{\"choices\":[]}"));

        assertThrows(
                GroqServiceException.class,
                () -> groqService.generateContent("test prompt")
        );

        verify(restTemplate, times(1)).postForEntity(
                eq("http://test-api-url"),
                any(),
                eq(String.class)
        );
    }

    @Test
    void missingMessageContentThrowsWithoutRetry() {
        String body = """
                {
                  "choices": [
                    {
                      "message": {}
                    }
                  ]
                }
                """;

        when(restTemplate.postForEntity(
                eq("http://test-api-url"),
                any(),
                eq(String.class)
        )).thenReturn(ResponseEntity.ok(body));

        assertThrows(
                GroqServiceException.class,
                () -> groqService.generateContent("test prompt")
        );

        verify(restTemplate, times(1)).postForEntity(
                eq("http://test-api-url"),
                any(),
                eq(String.class)
        );
    }

    @Test
    void malformedJsonThrowsWithoutRetry() {
        when(restTemplate.postForEntity(
                eq("http://test-api-url"),
                any(),
                eq(String.class)
        )).thenReturn(ResponseEntity.ok("{invalid json}"));

        assertThrows(
                GroqServiceException.class,
                () -> groqService.generateContent("test prompt")
        );

        verify(restTemplate, times(1)).postForEntity(
                eq("http://test-api-url"),
                any(),
                eq(String.class)
        );
    }

    private void verifyNoHttpCall() {
        verify(restTemplate, never()).postForEntity(
                any(String.class),
                any(),
                eq(String.class)
        );
    }
}

