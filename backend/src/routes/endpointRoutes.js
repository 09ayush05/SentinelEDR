import { Router } from "express";
import { getEndpoints, getEndpointById } from "../controllers/endpointController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/", protect, getEndpoints);
router.get("/:endpointId", protect, getEndpointById);

export default router;