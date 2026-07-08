package com.sentineledr.agent.detector;

import com.sentineledr.agent.config.AgentConfig;
import com.sentineledr.agent.entropy.EntropyCalculator;
import com.sentineledr.agent.model.FileEvent;
import com.sentineledr.agent.model.RiskAssessment;

public class RiskScorer {

    private final EntropyCalculator entropyCalc;
    private final MassModificationDetector massModDetector;
    private final SuspiciousExtensionDetector extDetector;

    public RiskScorer(AgentConfig config) {
        this.entropyCalc = new EntropyCalculator();
        this.massModDetector = new MassModificationDetector(
            config.getMassModificationThreshold(),
            config.getMassModificationWindowSeconds()
        );
        this.extDetector = new SuspiciousExtensionDetector();
    }

    public RiskAssessment evaluate(FileEvent event) {
        int totalScore = 0;
        StringBuilder reasons = new StringBuilder();

        // Signal 1: Entropy delta (0-35 points)
        int entropyScore = scoreEntropy(event);
        if (entropyScore > 0) {
            totalScore += entropyScore;
            reasons.append(String.format("Entropy: before=%.2f after=%.2f (score:%d); ",
                event.getEntropyBefore(), event.getEntropyAfter(), entropyScore));
        }

        // Signal 2: Mass modification rate (0-25 points)
        // Count both CREATED and MODIFIED as file activity
        int massModScore = massModDetector.recordModification();
        if (massModScore > 0) {
            totalScore += massModScore;
            reasons.append(String.format("MassMod: %d files/%ds (score:%d); ",
                massModDetector.getCurrentCount(),
                massModDetector.getWindowSeconds(),
                massModScore));
        }

        // Signal 3: Suspicious extension (0-30 points)
        String fileName = extractFileName(event.getFilePath());
        if (extDetector.isRansomNote(fileName)) {
            totalScore += 10;
            reasons.append("RansomNote detected (score:10); ");
        }
        if (extDetector.isSuspiciousExtension(event.getFileExtension())) {
            totalScore += 30;
            reasons.append(String.format("SuspiciousExt:.%s (score:30); ",
                event.getFileExtension()));
        }

        totalScore = Math.min(totalScore, 100);
        return new RiskAssessment(totalScore, determineSeverity(totalScore), reasons.toString().trim());
    }

    private int scoreEntropy(FileEvent event) {
        double before = event.getEntropyBefore();
        double after = event.getEntropyAfter();
        if (before < 0 || after < 0) return 0;
        double delta = after - before;
        if (after > 7.5 && delta > 3.0) return 35;
        if (after > 7.0 && delta > 2.5) return 25;
        if (after > 6.5 && delta > 2.0) return 15;
        if (after > 7.5)                return 10;
        return 0;
    }

    private String determineSeverity(int score) {
        if (score >= 86) return "CRITICAL";
        if (score >= 61) return "HIGH";
        if (score >= 31) return "MEDIUM";
        if (score > 0)   return "LOW";
        return "NORMAL";
    }

    private String extractFileName(String filePath) {
        if (filePath == null) return "";
        int lastSep = Math.max(filePath.lastIndexOf('/'), filePath.lastIndexOf('\\'));
        return filePath.substring(lastSep + 1).toLowerCase();
    }
}
