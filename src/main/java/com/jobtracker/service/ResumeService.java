package com.jobtracker.service;

import com.jobtracker.dto.request.ResumeMetadataRequest;
import com.jobtracker.dto.response.ResumeComparisonResponse;
import com.jobtracker.service.AtsScannerService;
import java.util.ArrayList;

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
    private final AtsScannerService atsScannerService;

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

            String atsColor = null;
            if (r.getAtsScore() != null) {
                    int score = r.getAtsScore();
                    if (score >= 85)
                            atsColor = "green";
                    else if (score >= 70)
                            atsColor = "blue";
                    else if (score >= 50)
                            atsColor = "amber";
                    else
                            atsColor = "red";
            }

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
                            // new fields
                            .roleTag(r.getRoleTag())
                            .notes(r.getNotes())
                            .atsScore(r.getAtsScore())
                            .atsLabel(r.getAtsLabel())
                            .targetCompanies(r.getTargetCompanies())
                            .atsScoreColor(atsColor)
                            // existing
                            .uploadedAt(r.getUploadedAt())
                            .downloadUrl("http://localhost:" + serverPort
                                            + "/api/v1/resumes/" + r.getId() + "/download")
                            .build();
    }

// ── UPDATE METADATA ──────────────────────────────────────────
@Transactional
public ResumeResponse updateMetadata(Long id,
        ResumeMetadataRequest request) {

    User user = securityUtils.getCurrentUser();
    Resume resume = resumeRepository.findByIdAndUser(id, user)
            .orElseThrow(() ->
                    new RuntimeException("Resume not found"));

    if (request.getLabel() != null) {
        resume.setLabel(request.getLabel());
    }
    if (request.getRoleTag() != null) {
        resume.setRoleTag(request.getRoleTag());
    }
    if (request.getNotes() != null) {
        resume.setNotes(request.getNotes());
    }
    if (request.getTargetCompanies() != null) {
        resume.setTargetCompanies(request.getTargetCompanies());
    }

    return toResponse(resumeRepository.save(resume),
                      user.getId());
}

// ── SCAN AND SAVE ATS SCORE ──────────────────────────────────
@Transactional
public ResumeResponse scanAndSaveAts(Long id,
        String jobDescription) throws Exception {

    User user = securityUtils.getCurrentUser();
    Resume resume = resumeRepository.findByIdAndUser(id, user)
            .orElseThrow(() ->
                    new RuntimeException("Resume not found"));

    // Load file and scan
    java.nio.file.Path filePath =
            fileStorageService.getFilePath(
                    user.getId(), resume.getFileName());
    org.springframework.core.io.Resource resource =
            new org.springframework.core.io.UrlResource(
                    filePath.toUri());

    if (!resource.exists()) {
        throw new RuntimeException("Resume file not found");
    }

    // Use AtsScannerService via text extraction
    org.apache.pdfbox.Loader loader = null;
    String resumeText;
    try (org.apache.pdfbox.pdmodel.PDDocument doc =
            org.apache.pdfbox.Loader.loadPDF(
                new org.apache.pdfbox.io.RandomAccessReadBuffer(
                    resource.getInputStream()))) {
        org.apache.pdfbox.text.PDFTextStripper stripper =
                new org.apache.pdfbox.text.PDFTextStripper();
        resumeText = stripper.getText(doc);
    }

    // Call ATS scanner
    com.jobtracker.dto.request.AtsScanTextRequest scanRequest =
            new com.jobtracker.dto.request.AtsScanTextRequest();
    scanRequest.setResumeText(resumeText);
    if (jobDescription != null && !jobDescription.isBlank()) {
        scanRequest.setJobDescription(jobDescription);
    }

    com.jobtracker.dto.response.AtsScanResponse scanResult =
            atsScannerService.scanText(scanRequest);

    // Save score
    resume.setAtsScore(scanResult.getAtsScore());
    resume.setAtsLabel(scanResult.getScoreLabel());

    return toResponse(resumeRepository.save(resume),
                      user.getId());
}

// ── COMPARE TWO RESUMES ──────────────────────────────────────
public ResumeComparisonResponse compare(Long id1, Long id2) {
    User user = securityUtils.getCurrentUser();

    Resume r1 = resumeRepository.findByIdAndUser(id1, user)
            .orElseThrow(() ->
                    new RuntimeException("Resume 1 not found"));
    Resume r2 = resumeRepository.findByIdAndUser(id2, user)
            .orElseThrow(() ->
                    new RuntimeException("Resume 2 not found"));

    ResumeResponse resp1 = toResponse(r1, user.getId());
    ResumeResponse resp2 = toResponse(r2, user.getId());

    // Determine winner
    String winner       = "tie";
    String winnerReason = "Both resumes have similar scores";
    int    diff         = 0;

    if (r1.getAtsScore() != null && r2.getAtsScore() != null) {
        diff = Math.abs(r1.getAtsScore() - r2.getAtsScore());
        if (r1.getAtsScore() > r2.getAtsScore() + 5) {
            winner = "resume1";
            winnerReason = r1.getLabel() + " scores "
                    + diff + " points higher in ATS";
        } else if (r2.getAtsScore() > r1.getAtsScore() + 5) {
            winner = "resume2";
            winnerReason = r2.getLabel() + " scores "
                    + diff + " points higher in ATS";
        }
    }

    // Build advantages
    List<String> adv1 = new ArrayList<>();
    List<String> adv2 = new ArrayList<>();

    if (r1.getAtsScore() != null && r2.getAtsScore() != null) {
        if (r1.getAtsScore() >= r2.getAtsScore()) {
            adv1.add("Higher ATS score ("
                    + r1.getAtsScore() + " vs "
                    + r2.getAtsScore() + ")");
        } else {
            adv2.add("Higher ATS score ("
                    + r2.getAtsScore() + " vs "
                    + r1.getAtsScore() + ")");
        }
    }
    if (r1.getVersionNumber() > r2.getVersionNumber()) {
        adv1.add("More recent version");
    } else {
        adv2.add("More recent version");
    }
    if (r1.getRoleTag() != null) {
        adv1.add("Tagged for: " + r1.getRoleTag());
    }
    if (r2.getRoleTag() != null) {
        adv2.add("Tagged for: " + r2.getRoleTag());
    }

    String recommendation;
    if ("resume1".equals(winner)) {
        recommendation = "Use " + r1.getLabel()
                + " for applications — it has a stronger ATS score.";
    } else if ("resume2".equals(winner)) {
        recommendation = "Use " + r2.getLabel()
                + " for applications — it has a stronger ATS score.";
    } else {
        recommendation = "Both resumes are comparable. "
                + "Choose based on the target role.";
    }

    return ResumeComparisonResponse.builder()
            .resume1(resp1)
            .resume2(resp2)
            .winner(winner)
            .winnerReason(winnerReason)
            .resume1Advantages(adv1)
            .resume2Advantages(adv2)
            .scoreDifference(diff)
            .recommendation(recommendation)
            .build();
}

// ── GET BY ROLE TAG ──────────────────────────────────────────
public List<ResumeResponse> getByRoleTag(String roleTag) {
    User user = securityUtils.getCurrentUser();
    return resumeRepository
            .findByUserAndRoleTagOrderByVersionNumberDesc(
                    user, roleTag)
            .stream()
            .map(r -> toResponse(r, user.getId()))
            .toList();
}

// ── GET ALL ROLE TAGS ────────────────────────────────────────
public List<String> getRoleTags() {
    User user = securityUtils.getCurrentUser();
    return resumeRepository.findDistinctRoleTagsByUser(user);
}
}
