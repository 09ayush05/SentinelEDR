package com.sentineledr.agent.model;

import java.util.Arrays;
import java.util.List;

/**
 * Represents the risk assessment result for a file event.
 * Produced by RiskScorer and consumed by CommunicationModule.
 */
public class RiskAssessment {

    private final int score;
    private final String severity;
    private final List<String> reasons;

    // Constructor used by RiskScorer: (int score, String severity, String reasons)
    public RiskAssessment(int score, String severity, String reasons) {
        this.score = score;
        this.severity = severity.toLowerCase();
        this.reasons = Arrays.asList(reasons.split(";"));
    }

    // Constructor used elsewhere: (int score, List<String> reasons)
    public RiskAssessment(int score, List<String> reasons) {
        this.score = score;
        this.reasons = reasons;
        this.severity = computeSeverity(score);
    }

    private String computeSeverity(int score) {
        if (score >= 86) return "critical";
        if (score >= 61) return "high";
        if (score >= 31) return "medium";
        if (score > 0)   return "low";
        return "normal";
    }

    public int getScore() { return score; }
    public String getSeverity() { return severity; }
    public List<String> getReasons() { return reasons; }

    public boolean isThreat() { return score >= 31; }
    public boolean isCritical() { return score >= 86; }

    @Override
    public String toString() {
        return String.format("RiskAssessment{score=%d, severity=%s, reasons=%s}",
            score, severity, reasons);
    }
}
