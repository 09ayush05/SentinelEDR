import "dotenv/config";
import http from "http";
import { Server } from "socket.io";
import app from "./app.js";
import { connectDatabase } from "./config/database.js";
import { validateConfig } from "./config/index.js";
import logger from "./utils/logger.js";
import { registerAgentHandlers } from "./sockets/agentSocketHandler.js";

async function startServer() {
  try {
    validateConfig();
    logger.info("Configuration validated");

    try {
      await connectDatabase();
    } catch (dbError) {
      logger.warn("MongoDB unavailable - running without database");
    }

    const PORT = process.env.PORT || 5000;
    const httpServer = http.createServer(app);

    // Attach Socket.IO to the HTTP server
    const io = new Server(httpServer, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    });

    // Handle incoming Socket.IO connections
    io.on("connection", (socket) => {
      // Identify connection type by handshake query
      const clientType = socket.handshake.query.clientType || "unknown";

      if (clientType === "agent") {
        registerAgentHandlers(socket, io);
      } else {
        // Dashboard client connected
        logger.info("Dashboard client connected: " + socket.id);
        socket.on("disconnect", () => {
          logger.info("Dashboard client disconnected: " + socket.id);
        });
      }
    });

    httpServer.listen(PORT, () => {
      logger.info("SentinelEDR backend listening on port " + PORT);
      logger.info("Health check: http://localhost:" + PORT + "/api/health");
      logger.info("Socket.IO ready for agent and dashboard connections");
    });

  } catch (error) {
    logger.error("Failed to start server: " + error.message);
    process.exit(1);
  }
}

startServer();
