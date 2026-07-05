import mongoose from "mongoose";

/**
 * FileEvent model - raw file system events from the Java agent.
 *
 * Every file create/modify/delete/rename the agent detects gets
 * stored here. This is the raw telemetry layer - the risk scoring
 * engine reads these events to compute threat scores.
 *
 * In a high-volume production system you would use a time-series DB
 * (InfluxDB, TimescaleDB) for this - MongoDB works fine for our scale.
 */
const fileEventSchema = new mongoose.Schema(
  {
    endpointId: {
      type: String,
      required: true,
      index: true,
    },
    // Type of file system event detected by WatchService
    eventType: {
      type: String,
      enum: ["CREATED", "MODIFIED", "DELETED", "RENAMED"],
      required: true,
      index: true,
    },
    filePath: {
      type: String,
      required: true,
    },
    // For rename events - what the file was renamed to
    newFilePath: {
      type: String,
    },
    // File extension before and after (used for suspicious extension detection)
    fileExtension: {
      type: String,
    },
    newFileExtension: {
      type: String,
    },
    fileSizeBytes: {
      type: Number,
    },
    // Shannon entropy computed by the agent (null if not computed)
    entropyBefore: {
      type: Number,
      min: 0,
      max: 8,
    },
    entropyAfter: {
      type: Number,
      min: 0,
      max: 8,
    },
    // PID of the process that caused this file event (best-effort)
    associatedPid: {
      type: Number,
    },
    associatedProcessName: {
      type: String,
    },
    // Timestamp when the agent detected this event
    detectedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("FileEvent", fileEventSchema);
