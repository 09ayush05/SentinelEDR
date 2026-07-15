package com.sentineledr.agent.communication;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sentineledr.agent.config.AgentConfig;
import com.sentineledr.agent.model.FileEvent;
import com.sentineledr.agent.model.RiskAssessment;
import io.socket.client.IO;
import io.socket.client.Socket;
import org.json.JSONObject;

import java.net.URI;
import java.util.HashMap;
import java.util.Map;

public class CommunicationModule {

    private final AgentConfig config;
    private final ObjectMapper objectMapper;
    private Socket socket;
    private volatile boolean connected = false;

    public CommunicationModule(AgentConfig config) {
        this.config = config;
        this.objectMapper = new ObjectMapper();
    }

    public void connect() {
        try {
            IO.Options options = IO.Options.builder()
                .setReconnection(true)
                .setReconnectionAttempts(Integer.MAX_VALUE)
                .setReconnectionDelay(1000)
                .setReconnectionDelayMax(5000)
                .setQuery("clientType=agent")
                .build();

            socket = IO.socket(URI.create(config.getBackendUrl()), options);

            socket.on(Socket.EVENT_CONNECT, args -> {
                connected = true;
                System.out.println("[CommunicationModule] Connected to backend: " + config.getBackendUrl());
                sendRegistration();
            });

            socket.on(Socket.EVENT_DISCONNECT, args -> {
                connected = false;
                System.out.println("[CommunicationModule] Disconnected from backend");
            });

            socket.on(Socket.EVENT_CONNECT_ERROR, args -> {
                connected = false;
                if (args.length > 0) {
                    System.out.println("[CommunicationModule] Connection error: " + args[0]);
                }
            });

            socket.connect();
            System.out.println("[CommunicationModule] Attempting connection to " + config.getBackendUrl());

        } catch (Exception e) {
            System.err.println("[CommunicationModule] Failed to initialize: " + e.getMessage());
        }
    }

    private void sendRegistration() {
        try {
            Map<String, String> registration = new HashMap<>();
            registration.put("endpointId", config.getEndpointId());
            registration.put("hostname", config.getHostname());
            registration.put("agentVersion", "1.0.0");
            registration.put("osInfo", System.getProperty("os.name") + " " + System.getProperty("os.version"));
            String json = objectMapper.writeValueAsString(registration);
            socket.emit("endpoint:register", new JSONObject(json));
            System.out.println("[CommunicationModule] Registration sent for: " + config.getEndpointId());
        } catch (Exception e) {
            System.err.println("[CommunicationModule] Failed to send registration: " + e.getMessage());
        }
    }

    public void sendFileEvent(FileEvent event, RiskAssessment assessment) {
        if (!connected || socket == null) {
            System.out.println("[CommunicationModule] Not connected - dropping event");
            return;
        }
        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("endpointId", event.getEndpointId());
            payload.put("eventType", event.getEventType().toString());
            payload.put("filePath", event.getFilePath());
            payload.put("fileExtension", event.getFileExtension());
            payload.put("fileSizeBytes", event.getFileSizeBytes());
            if (event.getEntropyBefore() >= 0) {
                payload.put("entropyBefore", event.getEntropyBefore());
            }
            if (event.getEntropyAfter() >= 0) {
                payload.put("entropyAfter", event.getEntropyAfter());
            }
            payload.put("detectedAt", event.getDetectedAt().toString());
            payload.put("riskScore", assessment.getScore());
            payload.put("severity", assessment.getSeverity());
            if (event.getNewFilePath() != null) {
                payload.put("newFilePath", event.getNewFilePath());
                payload.put("newFileExtension", event.getNewFileExtension());
            }
            String json = objectMapper.writeValueAsString(payload);
            socket.emit("agent:fileEvent", new JSONObject(json));
        } catch (Exception e) {
            System.err.println("[CommunicationModule] Failed to send file event: " + e.getMessage());
        }
    }

    public void sendAlert(FileEvent event, RiskAssessment assessment) {
        if (!connected || socket == null) {
            System.out.println("[CommunicationModule] Not connected - dropping alert");
            return;
        }
        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("endpointId", event.getEndpointId());
            payload.put("hostname", config.getHostname());
            payload.put("filePath", event.getFilePath());
            payload.put("riskScore", assessment.getScore());
            payload.put("severity", assessment.getSeverity());
            payload.put("title", "Suspicious activity detected: " + event.getEventType() + " on " + event.getFilePath());
            payload.put("description", String.join("; ", assessment.getReasons()));
            payload.put("detectedAt", event.getDetectedAt().toString());
            String json = objectMapper.writeValueAsString(payload);
            socket.emit("agent:alert", new JSONObject(json));
            System.out.println("[CommunicationModule] Alert sent - Score: " + assessment.getScore() + "/100");
        } catch (Exception e) {
            System.err.println("[CommunicationModule] Failed to send alert: " + e.getMessage());
        }
    }

    public boolean isConnected() { return connected; }

    public void disconnect() {
        if (socket != null) {
            socket.disconnect();
            socket.close();
        }
    }
}