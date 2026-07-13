import logger from "../utils/logger.js";
import Alert from "../models/Alert.js";
import Endpoint from "../models/Endpoint.js";
import FileEvent from "../models/FileEvent.js";

/**
 * Handles all Socket.IO events from Java agents.
 * Called once per connected agent socket.
 */
export function registerAgentHandlers(socket, io) {
  logger.info("Agent socket connected: " + socket.id);

  // Agent registers itself on connect
  socket.on("endpoint:register", async (data) => {
    try {
      const endpoint = await Endpoint.findOneAndUpdate(
        { endpointId: data.endpointId },
        {
          endpointId: data.endpointId,
          hostname: data.hostname,
          agentVersion: data.agentVersion,
          watchedPaths: data.watchedPaths,
          osInfo: data.osInfo,
          status: "online",
          lastSeen: new Date(),
        },
        { upsert: true, new: true }
      );
      socket.endpointId = data.endpointId;
      socket.join("endpoint:" + data.endpointId);
      logger.info("Endpoint registered: " + data.hostname + " (" + data.endpointId + ")");
      io.emit("endpoint:updated", endpoint);
    } catch (error) {
      logger.error("Failed to register endpoint: " + error.message);
    }
  });

  // Receive file events from agent
  socket.on("agent:fileEvent", async (data) => {
    try {
      // Update endpoint last seen
      await Endpoint.findOneAndUpdate(
        { endpointId: data.endpointId },
        { lastSeen: new Date(), currentRiskScore: data.riskScore }
      );

      // Store file event in DB
      await FileEvent.create({
        endpointId: data.endpointId,
        eventType: data.eventType,
        filePath: data.filePath,
        fileExtension: data.fileExtension,
        fileSizeBytes: data.fileSizeBytes,
        entropyBefore: data.entropyBefore >= 0 ? data.entropyBefore : undefined,
        entropyAfter: data.entropyAfter >= 0 ? data.entropyAfter : undefined,
        detectedAt: new Date(data.detectedAt),
      });

      // Broadcast to dashboard clients
      io.to("dashboard").emit("dashboard:fileEvent", data);

    } catch (error) {
      logger.error("Failed to process file event: " + error.message);
    }
  });

  // Receive alerts from agent
  socket.on("agent:alert", async (data) => {
    try {
      const alert = await Alert.create({
        endpointId: data.endpointId,
        hostname: data.hostname,
        severity: data.severity.toLowerCase(),
        riskScore: data.riskScore,
        title: data.title,
        description: data.description,
        evidence: { affectedFiles: [data.filePath] },
        status: "new",
      });

      logger.warn("ALERT: " + data.severity + " from " + data.hostname +
        " (score: " + data.riskScore + ")");

      // Broadcast alert to all dashboard clients immediately
      io.to("dashboard").emit("dashboard:alert", alert);

    } catch (error) {
      logger.error("Failed to process alert: " + error.message);
    }
  });

  // Handle agent disconnect
  socket.on("disconnect", async () => {
    if (socket.endpointId) {
      try {
        await Endpoint.findOneAndUpdate(
          { endpointId: socket.endpointId },
          { status: "offline" }
        );
        io.emit("endpoint:offline", { endpointId: socket.endpointId });
        logger.info("Agent disconnected: " + socket.endpointId);
      } catch (error) {
        logger.error("Failed to update endpoint status: " + error.message);
      }
    }
  });
}
