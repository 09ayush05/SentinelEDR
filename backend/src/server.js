import "dotenv/config";
import http from "http";
import app from "./app.js";
import { connectDatabase } from "./config/database.js";
import { validateConfig } from "./config/index.js";
import logger from "./utils/logger.js";

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

    httpServer.listen(PORT, () => {
      logger.info("SentinelEDR backend listening on port " + PORT);
      logger.info("Health check: http://localhost:" + PORT + "/api/health");
    });

  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
}

startServer();
