import { Router } from "express";
import { getAlerts, updateAlertStatus } from "../controllers/alertController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/", protect, getAlerts);
router.patch("/:id/status", protect, updateAlertStatus);

export default router;