package com.sentineledr.agent;

import com.sentineledr.agent.config.AgentConfig;
import com.sentineledr.agent.entropy.EntropyCalculator;
import com.sentineledr.agent.model.FileEvent;
import com.sentineledr.agent.monitor.FileMonitor;

public class Main {

    public static void main(String[] args) throws InterruptedException {
        System.out.println("===========================================");
        System.out.println("  SentinelEDR Endpoint Agent v1.0.0");
        System.out.println("===========================================");

        AgentConfig config = new AgentConfig();
        System.out.println("[Main] Endpoint ID: " + config.getEndpointId());
        System.out.println("[Main] Hostname: " + config.getHostname());
        System.out.println("[Main] Watching paths: " + config.getWatchPaths());
        System.out.println("[Main] Backend URL: " + config.getBackendUrl());

        EntropyCalculator entropyCalc = new EntropyCalculator();

        FileMonitor fileMonitor = new FileMonitor(config, entropyCalc, event -> {
            printFileEvent(event, config.getEntropyThreshold());
        });
        fileMonitor.start();

        System.out.println("[Main] Agent running. Modify files in watched directories to see events.");
        System.out.println("[Main] Press Ctrl+C to stop.");

        Thread.currentThread().join();
    }

    private static void printFileEvent(FileEvent event, double entropyThreshold) {
        StringBuilder sb = new StringBuilder();
        sb.append("[EVENT] ").append(event.getEventType());
        sb.append(" | ").append(event.getFilePath());

        if (event.getEntropyAfter() >= 0) {
            sb.append(String.format(" | entropy: %.2f", event.getEntropyAfter()));
            if (event.getEntropyBefore() >= 0) {
                double delta = event.getEntropyAfter() - event.getEntropyBefore();
                sb.append(String.format(" (delta: %+.2f)", delta));
            }
            if (event.getEntropyAfter() > entropyThreshold) {
                sb.append(" *** HIGH ENTROPY - SUSPICIOUS ***");
            }
        }

        System.out.println(sb.toString());
    }
}
