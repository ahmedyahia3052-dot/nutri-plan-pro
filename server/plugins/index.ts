import { Router } from "express";
import mobileSyncRouter from "./mobile-sync/routes";
import reportsRouter from "./reports/routes";
import goalsStreaksRouter from "./goals-streaks/routes";

const pluginRouter = Router();

pluginRouter.get("/", (_req, res) => {
  res.json({
    plugins: [
      { id: "ai-nutrition",    version: "1.0.0", status: "active" },
      { id: "drug-checker",   version: "1.0.0", status: "active" },
      { id: "reports",        version: "1.0.0", status: "active" },
      { id: "mobile-sync",    version: "1.0.0", status: "active" },
      { id: "barcode-scanner",version: "1.0.0", status: "active" },
      { id: "goals-streaks",  version: "1.0.0", status: "active" },
    ],
  });
});

pluginRouter.use("/mobile-sync",    mobileSyncRouter);
pluginRouter.use("/reports",        reportsRouter);
pluginRouter.use("/goals-streaks",  goalsStreaksRouter);

export default pluginRouter;
