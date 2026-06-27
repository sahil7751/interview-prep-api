package com.jobtracker.config;

import io.swagger.v3.oas.models.*;
import io.swagger.v3.oas.models.info.*;
import io.swagger.v3.oas.models.security.*;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SwaggerConfig {

    @Bean
    public OpenAPI openAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("CareerPilot AI API")
                        .description("AI-Powered Career & Placement Preparation Platform")
                        .version("2.0.0")
                        .contact(new Contact()
                                .name("Job Tracker Team")
                                .email("support@jobtracker.com"))
                        .license(new License()
                                .name("MIT License")))
                .addSecurityItem(
                        new SecurityRequirement().addList("Bearer Auth"))
                .components(new Components()
                        .addSecuritySchemes("Bearer Auth",
                                new SecurityScheme()
                                        .type(SecurityScheme.Type.HTTP)
                                        .scheme("bearer")
                                        .bearerFormat("JWT")
                                        .description("Enter JWT token")));
    }
}