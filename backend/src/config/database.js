import mongoose from "mongoose";
import logger from "../utils/logger.js";
import { config } from "./index.js";

export async function connectDatabase() {
  await mongoose.connect(config.mongoUri, {
    serverSelectionTimeoutMS: 3000,
  });
  logger.info("MongoDB connected successfully");
}

mongoose.connection.on("disconnected", () => {
  logger.warn("MongoDB disconnected");
});

mongoose.connection.on("reconnected", () => {
  logger.info("MongoDB reconnected");
});
