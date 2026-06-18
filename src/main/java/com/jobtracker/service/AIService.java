package com.jobtracker.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jobtracker.dto.request.InterviewQuestionsRequest;
import com.jobtracker.dto.request.ResumeAnalysisRequest;
import com.jobtracker.dto.request.SkillGapRequest;
import com.jobtracker.dto.response.InterviewQuestionsResponse;
import com.jobtracker.dto.response.ResumeAnalysisResponse;
import com.jobtracker.dto.response.SkillGapResponse;
import com.jobtracker.exception.GroqServiceException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AIService {

                private final GroqService groqService;
                private final ObjectMapper objectMapper = new ObjectMapper();

                private String callGroq(String prompt) {
                                return groqService.generateContent(prompt);
                }

                private String cleanJson(String raw) {
                                return raw
                                                                .replaceAll("(?s)```json\\s*", "")
                                                                .replaceAll("(?s)```\\s*", "")
                                                                .trim();
                }

                public ResumeAnalysisResponse analyzeResume(ResumeAnalysisRequest request) {
                                String prompt = """
                                                                You are an expert ATS resume reviewer.
                                                                Analyze the following resume and respond ONLY with valid JSON.
                                                                No explanation, no markdown, just raw JSON.

                                                                Resume:
                                                                %s

                                                                %s

                                                                Respond with this exact JSON structure:
                                                                {
                                                                        "atsScore": <number 0-100>,
                                                                        "scoreLabel": "<Excellent|Good|Average|Needs Work>",
                                                                        "strengths": ["<strength1>", "<strength2>"],
                                                                        "weaknesses": ["<weakness1>", "<weakness2>"],
                                                                        "missingKeywords": ["<keyword1>", "<keyword2>"],
                                                                        "improvementSuggestions": ["<suggestion1>", "<suggestion2>"],
                                                                        "overallFeedback": "<2-3 sentence summary>"
                                                                }
                                                                """.formatted(
                                                                request.getResumeText(),
                                                                request.getJobDescription() != null
                                                                                                ? "Target Job Description:\n" + request.getJobDescription()
                                                                                                : "No specific job description provided.");

                                try {
                                                String raw = callGroq(prompt);
                                                String cleaned = cleanJson(raw);
                                                return objectMapper.readValue(cleaned, ResumeAnalysisResponse.class);
                                } catch (Exception e) {
                                                throw new GroqServiceException(HttpStatus.BAD_GATEWAY,
                                                                                "Failed to parse Groq resume analysis response: " + e.getMessage(), e);
                                }
                }

                public InterviewQuestionsResponse generateQuestions(InterviewQuestionsRequest request) {
                                String prompt = """
                                                                You are an expert technical interviewer.
                                                                Generate interview questions for the following role and respond
                                                                ONLY with valid JSON. No explanation, no markdown, just raw JSON.

                                                                Job Role: %s
                                                                Experience Level: %s
                                                                Job Description: %s

                                                                Respond with this exact JSON structure:
                                                                {
                                                                        "jobRole": "%s",
                                                                        "technicalQuestions": [
                                                                                {
                                                                                        "question": "<question text>",
                                                                                        "hint": "<brief answer hint>",
                                                                                        "difficulty": "<Easy|Medium|Hard>"
                                                                                }
                                                                        ],
                                                                        "behaviouralQuestions": [
                                                                                {
                                                                                        "question": "<question text>",
                                                                                        "hint": "<brief answer hint>",
                                                                                        "difficulty": "<Easy|Medium|Hard>"
                                                                                }
                                                                        ],
                                                                        "hrQuestions": [
                                                                                {
                                                                                        "question": "<question text>",
                                                                                        "hint": "<brief answer hint>",
                                                                                        "difficulty": "Easy"
                                                                                }
                                                                        ]
                                                                }

                                                                Generate %d questions total, distributed across the three categories.
                                                                """.formatted(
                                                                request.getJobRole() != null ? request.getJobRole() : "Software Engineer",
                                                                request.getExperienceLevel() != null ? request.getExperienceLevel() : "Fresher",
                                                                request.getJobDescription(),
                                                                request.getJobRole() != null ? request.getJobRole() : "Software Engineer",
                                                                request.getQuestionCount());

                                try {
                                                String raw = callGroq(prompt);
                                                String cleaned = cleanJson(raw);
                                                return objectMapper.readValue(cleaned, InterviewQuestionsResponse.class);
                                } catch (Exception e) {
                                                throw new GroqServiceException(HttpStatus.BAD_GATEWAY,
                                                                                "Failed to parse Groq interview questions response: " + e.getMessage(), e);
                                }
                }

                public SkillGapResponse analyzeSkillGap(SkillGapRequest request) {
                                String prompt = """
                                                                You are a career counselor and technical skills expert.
                                                                Analyze the skill gap and respond ONLY with valid JSON.
                                                                No explanation, no markdown, just raw JSON.

                                                                Target Role: %s
                                                                Job Description: %s
                                                                Candidate's Current Skills: %s

                                                                Respond with this exact JSON structure:
                                                                {
                                                                        "presentSkills": ["<skill1>", "<skill2>"],
                                                                        "missingSkills": ["<skill1>", "<skill2>"],
                                                                        "niceToHaveSkills": ["<skill1>", "<skill2>"],
                                                                        "matchPercentage": <number 0-100>,
                                                                        "learningPath": [
                                                                                {
                                                                                        "skill": "<skill name>",
                                                                                        "suggestedResource": "<resource name>",
                                                                                        "estimatedTime": "<e.g. 2 weeks>"
                                                                                }
                                                                        ],
                                                                        "summary": "<2-3 sentence overall assessment>"
                                                                }
                                                                """.formatted(
                                                                request.getTargetRole() != null ? request.getTargetRole() : "Software Engineer",
                                                                request.getJobDescription(),
                                                                request.getCurrentSkills());

                                try {
                                                String raw = callGroq(prompt);
                                                String cleaned = cleanJson(raw);
                                                return objectMapper.readValue(cleaned, SkillGapResponse.class);
                                } catch (Exception e) {
                                                throw new GroqServiceException(HttpStatus.BAD_GATEWAY,
                                                                                "Failed to parse Groq skill gap response: " + e.getMessage(), e);
                                }
                }

                public String getPlacementPrep(String jobDescription, String targetRole) {
                                String prompt = """
                                                                You are a placement preparation expert for engineering students.
                                                                Give a comprehensive placement preparation guide for the following.

                                                                Target Role: %s
                                                                Job Description: %s

                                                                Cover these sections:
                                                                1. Key topics to study
                                                                2. DSA topics to focus on
                                                                3. System design topics (if applicable)
                                                                4. Projects to build
                                                                5. Timeline (week-by-week for 4 weeks)
                                                                6. Resources (free + paid)
                                                                7. Mock interview tips

                                                                Be specific and actionable. Format as clean readable text.
                                                                """.formatted(targetRole, jobDescription);

                                return callGroq(prompt);
                }
}