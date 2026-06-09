package com.jobtracker.service;

import com.jobtracker.dto.request.InterviewRequest;
import com.jobtracker.dto.response.InterviewResponse;
import com.jobtracker.dto.response.PagedResponse;
import com.jobtracker.entity.*;
import com.jobtracker.repository.ApplicationRepository;
import com.jobtracker.repository.InterviewRepository;
import com.jobtracker.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class InterviewService {

    private final InterviewRepository interviewRepository;
    private final ApplicationRepository applicationRepository;
    private final SecurityUtils securityUtils;

    // ── CREATE ──────────────────────────────────────────────────
    @Transactional
    public InterviewResponse create(InterviewRequest request) {
        User user = securityUtils.getCurrentUser();

        Application application = null;
        if (request.getApplicationId() != null) {
            application = applicationRepository
                    .findByIdAndUser(request.getApplicationId(), user)
                    .orElseThrow(() -> new RuntimeException("Application not found or access denied"));
        }

        Interview interview = Interview.builder()
                .user(user)
                .application(application)
                .companyName(request.getCompanyName())
                .interviewDate(request.getInterviewDate())
                .interviewType(request.getInterviewType())
                .questionsAsked(request.getQuestionsAsked())
                .personalNotes(request.getPersonalNotes())
                .result(request.getResult())
                .build();

        return toResponse(interviewRepository.save(interview));
    }

    // ── READ ALL ────────────────────────────────────────────────
    public PagedResponse<InterviewResponse> getAll(
            int page, int size, String keyword, Long applicationId) {

        User user = securityUtils.getCurrentUser();
        Pageable pageable = PageRequest.of(page, size);

        Page<Interview> result;

        if (applicationId != null) {
            result = interviewRepository
                    .findByUserAndApplicationId(user, applicationId, pageable);

        } else if (keyword != null && !keyword.isBlank()) {
            result = interviewRepository
                    .searchByCompany(user, keyword, pageable);

        } else {
            result = interviewRepository
                    .findByUserOrderByInterviewDateDesc(user, pageable);
        }

        List<InterviewResponse> content = result.getContent()
                .stream()
                .map(this::toResponse)
                .toList();

        return PagedResponse.<InterviewResponse>builder()
                .content(content)
                .page(result.getNumber())
                .size(result.getSize())
                .totalElements(result.getTotalElements())
                .totalPages(result.getTotalPages())
                .last(result.isLast())
                .build();
    }

    // ── READ ONE ────────────────────────────────────────────────
    public InterviewResponse getById(Long id) {
        User user = securityUtils.getCurrentUser();

        return toResponse(
                interviewRepository.findByIdAndUser(id, user)
                        .orElseThrow(() -> new RuntimeException(
                                "Interview not found or access denied")));
    }

    // ── UPDATE ──────────────────────────────────────────────────
    @Transactional
    public InterviewResponse update(Long id, InterviewRequest request) {
        User user = securityUtils.getCurrentUser();

        Interview interview = interviewRepository
                .findByIdAndUser(id, user)
                .orElseThrow(() -> new RuntimeException("Interview not found or access denied"));

        Application application = null;
        if (request.getApplicationId() != null) {
            application = applicationRepository
                    .findByIdAndUser(request.getApplicationId(), user)
                    .orElseThrow(() -> new RuntimeException("Application not found"));
        }

        interview.setApplication(application);
        interview.setCompanyName(request.getCompanyName());
        interview.setInterviewDate(request.getInterviewDate());
        interview.setInterviewType(request.getInterviewType());
        interview.setQuestionsAsked(request.getQuestionsAsked());
        interview.setPersonalNotes(request.getPersonalNotes());
        interview.setResult(request.getResult());

        return toResponse(interviewRepository.save(interview));
    }

    // ── DELETE ──────────────────────────────────────────────────
    @Transactional
    public void delete(Long id) {
        User user = securityUtils.getCurrentUser();

        Interview interview = interviewRepository
                .findByIdAndUser(id, user)
                .orElseThrow(() -> new RuntimeException("Interview not found or access denied"));

        interviewRepository.delete(interview);
    }

    // ── MAPPER ──────────────────────────────────────────────────
    private InterviewResponse toResponse(Interview i) {
        return InterviewResponse.builder()
                .id(i.getId())
                .companyName(i.getCompanyName())
                .applicationId(i.getApplication() != null
                        ? i.getApplication().getId()
                        : null)
                .applicationRole(i.getApplication() != null
                        ? i.getApplication().getJobRole()
                        : null)
                .interviewDate(i.getInterviewDate())
                .interviewType(i.getInterviewType())
                .questionsAsked(i.getQuestionsAsked())
                .personalNotes(i.getPersonalNotes())
                .result(i.getResult())
                .createdAt(i.getCreatedAt())
                .build();
    }
}

