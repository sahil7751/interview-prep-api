package com.jobtracker.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jobtracker.dto.request.InterviewQuestionsRequest;
import com.jobtracker.dto.request.ResumeAnalysisRequest;
import com.jobtracker.dto.request.SkillGapRequest;
import com.jobtracker.dto.response.InterviewQuestionsResponse;
import com.jobtracker.dto.response.ResumeAnalysisResponse;
import com.jobtracker.dto.response.SkillGapResponse;
import com.jobtracker.entity.User;
import com.jobtracker.entity.XpAction;
import com.jobtracker.exception.GroqServiceException;
import com.jobtracker.security.SecurityUtils;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AIService {

        private final GroqService groqService;
        private final GamificationService gamificationService;
        private final SecurityUtils securityUtils;

        private final ObjectMapper objectMapper = new ObjectMapper();

        private void tryAwardXp(XpAction action) {
                try {
                        User user = securityUtils.getCurrentUser();
                        gamificationService.awardXp(user, action);
                } catch (Exception ignored) {
                }
        }

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

                                IMPORTANT:
                                Return raw JSON only.
                                Do not use markdown.
                                Do not wrap the response in triple backticks.

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

                        ResumeAnalysisResponse result = objectMapper.readValue(cleaned, ResumeAnalysisResponse.class);

                        tryAwardXp(XpAction.RESUME_ANALYSIS);

                        return result;

                } catch (Exception e) {
                        throw new GroqServiceException(
                                        HttpStatus.BAD_GATEWAY,
                                        "Failed to parse Groq resume analysis response: " + e.getMessage(),
                                        e);
                }
        }

        public InterviewQuestionsResponse generateQuestions(InterviewQuestionsRequest request) {

                String prompt = """
                                You are an expert technical interviewer.

                                IMPORTANT:
                                Return raw JSON only.
                                Do not use markdown.
                                Do not wrap the response in triple backticks.

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

                                Generate %d questions total distributed across all categories.
                                """.formatted(
                                request.getJobRole() != null
                                                ? request.getJobRole()
                                                : "Software Engineer",

                                request.getExperienceLevel() != null
                                                ? request.getExperienceLevel()
                                                : "Fresher",

                                request.getJobDescription(),

                                request.getJobRole() != null
                                                ? request.getJobRole()
                                                : "Software Engineer",

                                request.getQuestionCount());

                try {
                        String raw = callGroq(prompt);
                        String cleaned = cleanJson(raw);

                        InterviewQuestionsResponse result = objectMapper.readValue(cleaned,
                                        InterviewQuestionsResponse.class);

                        tryAwardXp(XpAction.GENERATE_QUESTIONS);

                        return result;

                } catch (Exception e) {
                        throw new GroqServiceException(
                                        HttpStatus.BAD_GATEWAY,
                                        "Failed to parse Groq interview questions response: " + e.getMessage(),
                                        e);
                }
        }

        public SkillGapResponse analyzeSkillGap(SkillGapRequest request) {

                String prompt = """
                                You are a career counselor and technical skills expert.

                                IMPORTANT:
                                Return raw JSON only.
                                Do not use markdown.
                                Do not wrap the response in triple backticks.

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
                                      "suggestedResource": "<resource>",
                                      "estimatedTime": "<e.g. 2 weeks>"
                                    }
                                  ],
                                  "summary": "<2-3 sentence overall assessment>"
                                }
                                """.formatted(
                                request.getTargetRole() != null
                                                ? request.getTargetRole()
                                                : "Software Engineer",

                                request.getJobDescription(),
                                request.getCurrentSkills());

                try {
                        String raw = callGroq(prompt);
                        String cleaned = cleanJson(raw);

                        SkillGapResponse result = objectMapper.readValue(cleaned, SkillGapResponse.class);

                        tryAwardXp(XpAction.SKILL_GAP_ANALYSIS);

                        return result;

                } catch (Exception e) {
                        throw new GroqServiceException(
                                        HttpStatus.BAD_GATEWAY,
                                        "Failed to parse Groq skill gap response: " + e.getMessage(),
                                        e);
                }
        }

        public String getPlacementPrep(String jobDescription, String targetRole) {

                String prompt = """
                                You are a placement preparation expert for engineering students.

                                Target Role: %s
                                Job Description: %s

                                Cover:
                                1. Key topics to study
                                2. DSA topics
                                3. System Design (if applicable)
                                4. Projects to build
                                5. 4-week preparation plan
                                6. Resources
                                7. Mock interview tips

                                Format as clean readable text.
                                """.formatted(targetRole, jobDescription);

                return callGroq(prompt);
        }
}