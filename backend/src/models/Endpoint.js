import mongoose from "mongoose";

/**
 * Endpoint model - represents a machine running the Java agent.
 *
 * Each endpoint registers itself with the backend when the agent starts.
 * The backend tracks its connection status, last seen time, and
 * current risk score so the dashboard can show endpoint health at a glance.
 */
const endpointSchema = new mongoose.Schema(
  {
    // Unique identifier sent by the agent (generated once, stored locally)
    endpointId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    hostname: {
      type: String,
      required: true,
      trim: true,
    },
    ipAddress: {
      type: String,
      trim: true,
    },
    osInfo: {
      type: String,
      trim: true,
    },
    agentVersion: {
      type: String,
      default: "1.0.0",
    },
    status: {
      type: String,
      enum: ["online", "offline", "warning", "critical"],
      default: "offline",
    },
    // Current risk score 0-100 computed by the agent risk scoring engine
    currentRiskScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
    // Directory paths being monitored by this agent
    watchedPaths: [
      {
        type: String,
      }
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Endpoint", endpointSchema);
