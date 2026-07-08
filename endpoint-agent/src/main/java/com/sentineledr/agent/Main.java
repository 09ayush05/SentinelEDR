package com.sentineledr.agent;

import com.sentineledr.agent.config.AgentConfig;
import com.sentineledr.agent.detector.RiskScorer;
import com.sentineledr.agent.entropy.EntropyCalculator;
import com.sentineledr.agent.model.FileEvent;
import com.sentineledr.agent.model.RiskAssessment;
import com.sentineledr.agent.monitor.FileMonitor;

public class Main {

    public static void main(String[] args) throws InterruptedException {
        System.out.println("===========================================");
        System.out.println("  SentinelEDR Endpoint Agent v1.0.0");
        System.out.println("===========================================");

        AgentConfig config = new AgentConfig();
        System.out.println("[Main] Endpoint ID: " + config.getEndpointId());
        System.out.println("[Main] Hostname: " + config.getHostname());
        System.out.println("[Main] Watching: " + config.getWatchPaths());
        System.out.println("[Main] Backend: " + config.getBackendUrl());

        EntropyCalculator entropyCalc = new EntropyCalculator();
        RiskScorer riskScorer = new RiskScorer(config);

        FileMonitor fileMonitor = new FileMonitor(config, entropyCalc, event -> {
            handleFileEvent(event, riskScorer);
        });
        fileMonitor.start();

        System.out.println("[Main] Agent running. Press Ctrl+C to stop.");
        Thread.currentThread().join();
    }

    private static void handleFileEvent(FileEvent event, RiskScorer riskScorer) {
        // Always print the raw event
        StringBuilder sb = new StringBuilder();
        sb.append("[EVENT] ").append(event.getEventType());
        sb.append(" | ").append(event.getFilePath());

        if (event.getEntropyAfter() >= 0) {
            sb.append(String.format(" | entropy: %.2f", event.getEntropyAfter()));
            if (event.getEntropyBefore() >= 0) {
                sb.append(String.format(" (delta: %+.2f)",
                    event.getEntropyAfter() - event.getEntropyBefore()));
            }
        }
        System.out.println(sb.toString());

        // Evaluate risk
        RiskAssessment assessment = riskScorer.evaluate(event);

        // Only print assessment if there is a threat signal
        if (assessment.isThreat()) {
            System.out.println("  >>> RISK ASSESSMENT: " + assessment);
        }

        // Print loud alert for critical threats
        if (assessment.isCritical()) {
            System.out.println("  !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
            System.out.println("  !!! CRITICAL THREAT DETECTED         !!!");
            System.out.println("  !!! Score: " + assessment.getScore() + "/100                    !!!");
            System.out.println("  !!! " + assessment.getReasons());
            System.out.println("  !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
        }
    }
}
