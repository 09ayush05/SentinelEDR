import mongoose from "mongoose";

/**
 * Alert model - a confirmed or suspected threat event.
 *
 * An alert is generated when the risk scoring engine crosses a threshold.
 * It contains the full evidence bundle: which files were affected,
 * which process triggered it, what the entropy readings were, etc.
 * This is what appears on the dashboard alert feed.
 */
const alertSchema = new mongoose.Schema(
  {
    // Reference to the endpoint that generated this alert
    endpointId: {
      type: String,
      required: true,
      index: true,
    },
    hostname: {
      type: String,
      required: true,
    },
    severity: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      required: true,
      index: true,
    },
    // Overall risk score that triggered this alert (0-100)
    riskScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    // Human-readable summary of what was detected
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    // Evidence bundle from the detection engine
    evidence: {
      // Files that triggered the alert
      affectedFiles: [String],
      // Number of files modified in the detection window
      fileModificationCount: Number,
      // Entropy readings that contributed to the score
      entropyReadings: [
        {
          filePath: String,
          entropyBefore: Number,
          entropyAfter: Number,
        }
      ],
      // Suspicious process info if identified
      suspiciousProcess: {
        pid: Number,
        name: String,
        executablePath: String,
        cpuUsage: Number,
      },
      // Detected ransom note filenames if any
      ransomNotes: [String],
    },
    status: {
      type: String,
      enum: ["new", "investigating", "resolved", "false_positive"],
      default: "new",
      index: true,
    },
    // Who acknowledged/resolved the alert
    resolvedBy: {
      type: String,
    },
    resolvedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Alert", alertSchema);
