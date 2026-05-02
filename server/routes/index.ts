import { Router } from "express";
import authRouter from "./auth";
import profileRouter from "./profile";
import referenceRouter from "./reference";
import interactionsRouter from "./interactions";
import foodsafetyRouter from "./foodsafety";
import nutritionRouter from "./nutrition";
import dietplansRouter from "./dietplans";
import dashboardRouter from "./dashboard";
import trackingRouter from "./tracking";
import pluginRouter from "../plugins/index";

const router = Router();

router.get("/healthz", (_req, res) => res.json({ ok: true, version: "2.0.0" }));

// ── Core routes ───────────────────────────────────────────────────────────────
router.use(authRouter);
router.use(referenceRouter);
router.use(interactionsRouter);
router.use(foodsafetyRouter);
router.use(nutritionRouter);
router.use(profileRouter);
router.use(dietplansRouter);
router.use(dashboardRouter);
router.use(trackingRouter);

// ── Plugin routes (additive — never override core routes above) ───────────────
router.use("/plugins", pluginRouter);

export default router;
