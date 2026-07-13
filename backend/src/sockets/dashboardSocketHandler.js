import logger from "../utils/logger.js";
import Alert from "../models/Alert.js";

/**
 * Handles all Socket.IO events from frontend dashboard clients.
 * Called once per connected dashboard socket, alongside registerAgentHandlers.
 */
export function registerDashboardHandlers(socket, io) {
  // Dashboard client joins its own room so agent broadcasts don't leak to agents
  // and dashboard-only events don't leak to agents either.
  socket.on("dashboard:join", () => {
    socket.join("dashboard");
    logger.info("Dashboard client joined: " + socket.id);
    socket.emit("dashboard:joined", { ok: true });
  });

  socket.on("alert:acknowledge", async (alertId) => {
    try {
      const alert = await Alert.findByIdAndUpdate(
        alertId,
        { status: "investigating" },
        { new: true }
      );
      if (alert) {
        io.to("dashboard").emit("dashboard:alertUpdated", alert);
        logger.info("Alert acknowledged: " + alertId);
      }
    } catch (error) {
      logger.error("Failed to acknowledge alert: " + error.message);
    }
  });

  socket.on("disconnect", () => {
    logger.info("Dashboard client disconnected: " + socket.id);
  });
}