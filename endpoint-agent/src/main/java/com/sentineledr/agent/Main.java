package com.sentineledr.agent;

import com.sentineledr.agent.communication.CommunicationModule;
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
        System.out.println("[Main] Hostname:    " + config.getHostname());
        System.out.println("[Main] Watching:    " + config.getWatchPaths());
        System.out.println("[Main] Backend:     " + config.getBackendUrl());

        // Initialize components
        EntropyCalculator entropyCalc = new EntropyCalculator();
        RiskScorer riskScorer = new RiskScorer(config);
        CommunicationModule comm = new CommunicationModule(config);

        // Connect to backend (non-blocking - agent works offline too)
        comm.connect();

        // Start file monitor
        FileMonitor fileMonitor = new FileMonitor(config, entropyCalc, event -> {
            handleFileEvent(event, riskScorer, comm);
        });
        fileMonitor.start();

        System.out.println("[Main] Agent running. Press Ctrl+C to stop.");

        // Shutdown hook for clean disconnect
        Runtime.getRuntime().addShutdownHook(new Thread(() -> {
            System.out.println("[Main] Shutting down...");
            fileMonitor.stop();
            comm.disconnect();
        }));

        Thread.currentThread().join();
    }

    private static void handleFileEvent(FileEvent event, RiskScorer riskScorer,
                                         CommunicationModule comm) {
        // Print raw event
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

        // Send all events to backend (backend decides what to store)
        comm.sendFileEvent(event, assessment);

        // Print and send alert if threat detected
        if (assessment.isThreat()) {
            System.out.println("  >>> RISK: " + assessment);
            comm.sendAlert(event, assessment);
        }

        // Print critical banner
        if (assessment.isCritical()) {
            System.out.println("  !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
            System.out.println("  !!! CRITICAL THREAT DETECTED         !!!");
            System.out.println("  !!! Score: " + assessment.getScore() + "/100");
            System.out.println("  !!! " + assessment.getReasons());
            System.out.println("  !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
        }
    }
}
