package com.sentineledr.agent.model;

/**
 * The output of the RiskScorer for a single file event.
 * Contains the numeric score, severity label, and human-readable reasons.
 */
public class RiskAssessment {

    private final int score;
    private final String severity;
    private final String reasons;

    public RiskAssessment(int score, String severity, String reasons) {
        this.score = score;
        this.severity = severity;
        this.reasons = reasons;
    }

    public int getScore() { return score; }
    public String getSeverity() { return severity; }
    public String getReasons() { return reasons; }

    public boolean isThreat() {
        return score >= 31;
    }

    public boolean isCritical() {
        return score >= 86;
    }

    @Override
    public String toString() {
        return String.format("[%s] Score: %d/100 | %s", severity, score, reasons);
    }
}
