import mongoose from "mongoose";
import logger from "../utils/logger.js";
import { config } from "./index.js";

export async function connectDatabase() {
  try {
    await mongoose.connect(config.mongoUri, {
      serverSelectionTimeoutMS: 15000,
    });
    logger.info("MongoDB connected successfully");
  } catch (err) {
    logger.error("MongoDB connection failed: " + err.message);
    throw err;
  }
}

mongoose.connection.on("disconnected", () => {
  logger.warn("MongoDB disconnected");
});

mongoose.connection.on("reconnected", () => {
  logger.info("MongoDB reconnected");
});