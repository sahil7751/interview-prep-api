package com.jobtracker.service;

import com.jobtracker.dto.request.ApplicationRequest;
import com.jobtracker.dto.response.ApplicationResponse;
import com.jobtracker.entity.Application;
import com.jobtracker.entity.ApplicationStatus;
import com.jobtracker.entity.User;
import com.jobtracker.entity.XpAction;
import com.jobtracker.repository.ApplicationRepository;
import com.jobtracker.util.ApplicationMapper;
import com.jobtracker.util.AuthUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ApplicationService {

    private final ApplicationRepository applicationRepository;
    private final AuthUtil authUtil;
    private final GamificationService gamificationService;

    // ── Create ──────────────────────────────────────────────

    @Transactional
    public ApplicationResponse create(ApplicationRequest request) {

        User user = authUtil.getCurrentUser();

        Application app = ApplicationMapper.toEntity(request, user);

        Application saved = applicationRepository.save(app);

        // Award XP + Auto Daily Streak
        try {
            gamificationService.recordActivity(
                    user,
                    XpAction.ADD_APPLICATION);
        } catch (Exception ignored) {
        }

        return ApplicationMapper.toResponse(saved);
    }

    // ── Read (paginated, search, filter) ────────────────────

    public Page<ApplicationResponse> getAll(int page, int size,
            String sortBy,
            String sortDir,
            String keyword,
            String status) {

        User user = authUtil.getCurrentUser();

        Sort sort = sortDir.equalsIgnoreCase("asc")
                ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();

        Pageable pageable = PageRequest.of(page, size, sort);

        ApplicationStatus statusEnum = null;

        if (status != null && !status.isBlank()) {
            try {
                statusEnum = ApplicationStatus.valueOf(status.toUpperCase());
            } catch (IllegalArgumentException e) {
                throw new RuntimeException("Invalid status: " + status);
            }
        }

        Page<Application> result;

        boolean hasKeyword = keyword != null && !keyword.isBlank();
        boolean hasStatus = statusEnum != null;

        if (hasKeyword && hasStatus) {
            result = applicationRepository.searchByKeywordAndStatus(
                    user, keyword, statusEnum, pageable);
        } else if (hasKeyword) {
            result = applicationRepository.searchByKeyword(
                    user, keyword, pageable);
        } else if (hasStatus) {
            result = applicationRepository.findByUserAndStatus(
                    user, statusEnum, pageable);
        } else {
            result = applicationRepository.findByUser(
                    user, pageable);
        }

        return result.map(ApplicationMapper::toResponse);
    }

    // ── Read Single ──────────────────────────────────────────

    public ApplicationResponse getById(Long id) {

        User user = authUtil.getCurrentUser();

        Application app = applicationRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new RuntimeException("Application not found"));

        return ApplicationMapper.toResponse(app);
    }

    // ── Update ───────────────────────────────────────────────

    @Transactional
    public ApplicationResponse update(Long id,
            ApplicationRequest request) {

        User user = authUtil.getCurrentUser();

        Application app = applicationRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new RuntimeException("Application not found"));

        ApplicationMapper.updateEntity(app, request);

        return ApplicationMapper.toResponse(
                applicationRepository.save(app));
    }

    // ── Delete ───────────────────────────────────────────────

    @Transactional
    public void delete(Long id) {

        User user = authUtil.getCurrentUser();

        Application app = applicationRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new RuntimeException("Application not found"));

        applicationRepository.delete(app);
    }

    // ── Status Update ────────────────────────────────────────

    @Transactional
    public ApplicationResponse updateStatus(Long id,
            String status) {

        User user = authUtil.getCurrentUser();

        Application app = applicationRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new RuntimeException("Application not found"));

        try {
            app.setStatus(ApplicationStatus.valueOf(status.toUpperCase()));
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Invalid status: " + status);
        }

        return ApplicationMapper.toResponse(
                applicationRepository.save(app));
    }
}