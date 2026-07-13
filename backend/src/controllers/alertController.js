import Alert from "../models/Alert.js";

export async function getAlerts(req, res, next) {
    try {
        const alerts = await Alert.find().sort({ createdAt: -1 }).limit(100);
        res.status(200).json({ success: true, data: alerts });
    } catch (error) {
        next(error);
    }
}

export async function updateAlertStatus(req, res, next) {
    try {
        const { status } = req.body;
        const validStatuses = ["new", "investigating", "resolved", "false_positive"];

        if (!validStatuses.includes(status)) {
            const err = new Error(`Status must be one of: ${validStatuses.join(", ")}`);
            err.statusCode = 400;
            throw err;
        }

        const alert = await Alert.findByIdAndUpdate(
            req.params.id,
            { status, resolvedBy: req.user.id, resolvedAt: status === "resolved" ? new Date() : undefined },
            { new: true }
        );

        if (!alert) {
            const err = new Error("Alert not found");
            err.statusCode = 404;
            throw err;
        }

        res.status(200).json({ success: true, data: alert });
    } catch (error) {
        next(error);
    }
}