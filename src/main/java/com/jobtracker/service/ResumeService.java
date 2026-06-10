package com.jobtracker.service;

import com.jobtracker.dto.response.ResumeResponse;
import com.jobtracker.entity.Resume;
import com.jobtracker.entity.User;
import com.jobtracker.repository.ResumeRepository;
import com.jobtracker.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Path;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ResumeService {

    private final ResumeRepository resumeRepository;
    private final FileStorageService fileStorageService;
    private final SecurityUtils securityUtils;

    @Value("${server.port:8081}")
    private String serverPort;

    // ── UPLOAD ───────────────────────────────────────────────────
    @Transactional
    public ResumeResponse upload(MultipartFile file, String label)
            throws IOException {

        User user = securityUtils.getCurrentUser();

        // Validate file
        fileStorageService.validatePdf(file);

        // Get next version number
        Integer maxVersion = resumeRepository.findMaxVersionByUser(user);
        int nextVersion = (maxVersion == null ? 0 : maxVersion) + 1;

        // Save file to disk
        String storedName = fileStorageService.saveFile(file, user.getId());

        // Save record to DB
        Resume resume = Resume.builder()
                .user(user)
                .fileName(storedName)
                .originalName(file.getOriginalFilename())
                .filePath(storedName)
                .fileSize(file.getSize())
                .versionNumber(nextVersion)
                .isActive(nextVersion == 1) // first upload is auto-active
                .label(label != null && !label.isBlank()
                        ? label
                        : "Resume v" + nextVersion)
                .build();

        return toResponse(resumeRepository.save(resume), user.getId());
    }

    // ── LIST ALL ─────────────────────────────────────────────────
    public List<ResumeResponse> getAll() {
        User user = securityUtils.getCurrentUser();

        return resumeRepository
                .findByUserOrderByVersionNumberDesc(user)
                .stream()
                .map(r -> toResponse(r, user.getId()))
                .toList();
    }

    // ── GET ONE ──────────────────────────────────────────────────
    public ResumeResponse getById(Long id) {
        User user = securityUtils.getCurrentUser();

        Resume resume = resumeRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new RuntimeException("Resume not found or access denied"));

        return toResponse(resume, user.getId());
    }

    // ── DOWNLOAD ─────────────────────────────────────────────────
    public Resource download(Long id) throws MalformedURLException {
        User user = securityUtils.getCurrentUser();

        Resume resume = resumeRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new RuntimeException("Resume not found or access denied"));

        Path filePath = fileStorageService
                .getFilePath(user.getId(), resume.getFileName());

        Resource resource = new UrlResource(filePath.toUri());

        if (!resource.exists() || !resource.isReadable()) {
            throw new RuntimeException("File not found on server");
        }

        return resource;
    }

    // ── SET ACTIVE ───────────────────────────────────────────────
    @Transactional
    public ResumeResponse setActive(Long id) {
        User user = securityUtils.getCurrentUser();

        Resume resume = resumeRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new RuntimeException("Resume not found or access denied"));

        // Deactivate all, then activate this one
        resumeRepository.deactivateAllForUser(user);
        resume.setIsActive(true);

        return toResponse(resumeRepository.save(resume), user.getId());
    }

    // ── UPDATE LABEL ─────────────────────────────────────────────
    @Transactional
    public ResumeResponse updateLabel(Long id, String label) {
        User user = securityUtils.getCurrentUser();

        Resume resume = resumeRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new RuntimeException("Resume not found or access denied"));

        resume.setLabel(label);
        return toResponse(resumeRepository.save(resume), user.getId());
    }

    // ── DELETE ───────────────────────────────────────────────────
    @Transactional
    public void delete(Long id) {
        User user = securityUtils.getCurrentUser();

        Resume resume = resumeRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new RuntimeException("Resume not found or access denied"));

        // Delete file from disk
        fileStorageService.deleteFile(user.getId(), resume.getFileName());

        // Delete DB record
        resumeRepository.delete(resume);
    }

    // ── MAPPER ───────────────────────────────────────────────────
    private ResumeResponse toResponse(Resume r, Long userId) {
        return ResumeResponse.builder()
                .id(r.getId())
                .fileName(r.getFileName())
                .originalName(r.getOriginalName())
                .fileSize(r.getFileSize())
                .fileSizeReadable(fileStorageService
                        .readableFileSize(r.getFileSize()))
                .versionNumber(r.getVersionNumber())
                .isActive(r.getIsActive())
                .label(r.getLabel())
                .uploadedAt(r.getUploadedAt())
                .downloadUrl("http://localhost:" + serverPort
                        + "/api/v1/resumes/" + r.getId() + "/download")
                .build();
    }
}
