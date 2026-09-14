package com.jobtracker.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;

@Configuration
public class AppConfig {

    // These properties already existed in application.yml / application-prod.yml
    // but were previously unused — the RestTemplate bean had no timeout at all.
    @Value("${groq.api.connect-timeout-ms:10000}")
    private long groqConnectTimeoutMs;

    @Value("${groq.api.read-timeout-ms:30000}")
    private long groqReadTimeoutMs;

    @Bean
    public RestTemplate restTemplate(RestTemplateBuilder builder) {
        return builder
                .connectTimeout(Duration.ofMillis(groqConnectTimeoutMs))
                .readTimeout(Duration.ofMillis(groqReadTimeoutMs))
                .build();
    }
}