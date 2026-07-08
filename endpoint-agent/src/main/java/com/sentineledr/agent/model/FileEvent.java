package com.sentineledr.agent.model;

import java.time.Instant;

public class FileEvent {

    public enum EventType {
        CREATED, MODIFIED, DELETED, RENAMED
    }

    private final String endpointId;
    private final EventType eventType;
    private final String filePath;
    private String newFilePath;
    private final String fileExtension;
    private String newFileExtension;
    private long fileSizeBytes;
    private double entropyBefore;
    private double entropyAfter;
    private final Instant detectedAt;

    public FileEvent(String endpointId, EventType eventType, String filePath) {
        this.endpointId = endpointId;
        this.eventType = eventType;
        this.filePath = filePath;
        this.fileExtension = extractExtension(filePath);
        this.detectedAt = Instant.now();
        this.entropyBefore = -1;
        this.entropyAfter = -1;
    }

    private String extractExtension(String path) {
        if (path == null) return "";
        int lastDot = path.lastIndexOf(".");
        int lastSep = Math.max(path.lastIndexOf("/"), path.lastIndexOf("\\"));
        if (lastDot > lastSep && lastDot < path.length() - 1) {
            return path.substring(lastDot + 1).toLowerCase();
        }
        return "";
    }

    public String getEndpointId() { return endpointId; }
    public EventType getEventType() { return eventType; }
    public String getFilePath() { return filePath; }
    public String getNewFilePath() { return newFilePath; }
    public String getFileExtension() { return fileExtension; }
    public String getNewFileExtension() { return newFileExtension; }
    public long getFileSizeBytes() { return fileSizeBytes; }
    public double getEntropyBefore() { return entropyBefore; }
    public double getEntropyAfter() { return entropyAfter; }
    public Instant getDetectedAt() { return detectedAt; }

    public void setNewFilePath(String newFilePath) {
        this.newFilePath = newFilePath;
        this.newFileExtension = extractExtension(newFilePath);
    }
    public void setFileSizeBytes(long fileSizeBytes) { this.fileSizeBytes = fileSizeBytes; }
    public void setEntropyBefore(double entropyBefore) { this.entropyBefore = entropyBefore; }
    public void setEntropyAfter(double entropyAfter) { this.entropyAfter = entropyAfter; }

    @Override
    public String toString() {
        return String.format("[%s] %s | %s | entropy: %.2f->%.2f",
            detectedAt, eventType, filePath, entropyBefore, entropyAfter);
    }
}
