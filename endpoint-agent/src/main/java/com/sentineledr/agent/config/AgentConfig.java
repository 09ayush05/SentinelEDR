package com.sentineledr.agent.config;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Arrays;
import java.util.List;
import java.util.Properties;
import java.util.UUID;

public class AgentConfig {

    private final Properties props = new Properties();
    private final String endpointId;

    public AgentConfig() {
        loadProperties();
        this.endpointId = resolveEndpointId();
    }

    private void loadProperties() {
        Path configPath = Paths.get("agent.properties");
        if (Files.exists(configPath)) {
            try (InputStream is = Files.newInputStream(configPath)) {
                props.load(is);
                return;
            } catch (IOException e) {
                System.err.println("Failed to load agent.properties: " + e.getMessage());
            }
        }
        props.setProperty("backend.url", "http://localhost:5000");
        props.setProperty("watch.paths", System.getProperty("user.home") + "/Documents");
        props.setProperty("entropy.threshold", "7.0");
        props.setProperty("mass.modification.threshold", "10");
        props.setProperty("mass.modification.window.seconds", "10");
    }

    private String resolveEndpointId() {
        Path idFile = Paths.get("endpoint-id.txt");
        if (Files.exists(idFile)) {
            try {
                return Files.readString(idFile).trim();
            } catch (IOException e) {
                System.err.println("Could not read endpoint ID: " + e.getMessage());
            }
        }
        String newId = UUID.randomUUID().toString();
        try {
            Files.writeString(idFile, newId);
        } catch (IOException e) {
            System.err.println("Could not save endpoint ID: " + e.getMessage());
        }
        return newId;
    }

    public String getBackendUrl() {
        return props.getProperty("backend.url", "http://localhost:5000");
    }

    public List<String> getWatchPaths() {
        String raw = props.getProperty("watch.paths", System.getProperty("user.home") + "/Documents");
        return Arrays.asList(raw.split(","));
    }

    public double getEntropyThreshold() {
        return Double.parseDouble(props.getProperty("entropy.threshold", "7.0"));
    }

    public int getMassModificationThreshold() {
        return Integer.parseInt(props.getProperty("mass.modification.threshold", "10"));
    }

    public long getMassModificationWindowSeconds() {
        return Long.parseLong(props.getProperty("mass.modification.window.seconds", "10"));
    }

    public String getEndpointId() { return endpointId; }

    public String getHostname() {
        try {
            return java.net.InetAddress.getLocalHost().getHostName();
        } catch (Exception e) {
            return "unknown-host";
        }
    }
}
