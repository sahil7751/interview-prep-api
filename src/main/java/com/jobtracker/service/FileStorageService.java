package com.jobtracker.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.util.UUID;

@Service
public class FileStorageService {

    @Value("${file.upload-dir:uploads/resumes}")
    private String uploadDir;

    // Save file to disk, return the stored filename
    public String saveFile(MultipartFile file, Long userId) throws IOException {
        // Create directory if it doesn't exist
        Path uploadPath = Paths.get(uploadDir, String.valueOf(userId));
        Files.createDirectories(uploadPath);

        // Generate unique filename to avoid collisions
        String extension = getExtension(file.getOriginalFilename());
        String storedName = UUID.randomUUID() + "." + extension;

        Path filePath = uploadPath.resolve(storedName);
        Files.copy(file.getInputStream(), filePath,
                StandardCopyOption.REPLACE_EXISTING);

        return storedName;
    }

    // Get full path for a stored file
    public Path getFilePath(Long userId, String storedName) {
        return Paths.get(uploadDir, String.valueOf(userId), storedName);
    }

    // Delete file from disk
    public void deleteFile(Long userId, String storedName) {
        try {
            Path filePath = Paths.get(uploadDir,
                    String.valueOf(userId), storedName);
            Files.deleteIfExists(filePath);
        } catch (IOException e) {
            // Log but don't throw — DB record deletion should still proceed
            System.err.println("Could not delete file: " + storedName);
        }
    }

    // Validate that uploaded file is a PDF
    public void validatePdf(MultipartFile file) {
        if (file.isEmpty()) {
            throw new RuntimeException("File is empty");
        }

        String originalName = file.getOriginalFilename();
        if (originalName == null ||
                !originalName.toLowerCase().endsWith(".pdf")) {
            throw new RuntimeException("Only PDF files are allowed");
        }

        // 5 MB limit
        if (file.getSize() > 5 * 1024 * 1024) {
            throw new RuntimeException("File size must be under 5 MB");
        }
    }

    private String getExtension(String filename) {
        if (filename == null || !filename.contains("."))
            return "pdf";
        return filename.substring(filename.lastIndexOf('.') + 1);
    }

    // Convert bytes to readable format
    public String readableFileSize(long bytes) {
        if (bytes < 1024)
            return bytes + " B";
        if (bytes < 1024 * 1024)
            return (bytes / 1024) + " KB";
        return String.format("%.1f MB", bytes / (1024.0 * 1024));
    }
}
