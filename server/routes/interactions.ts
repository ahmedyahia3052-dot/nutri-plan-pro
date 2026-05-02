import { Router } from "express";
import { db, medicationsTable, foodDrugInteractionsTable } from "../db/index";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/reference/medications", async (_req, res) => {
  try {
    const meds = await db.select().from(medicationsTable);
    res.json(meds);
  } catch (err) {
    console.error("Failed to get medications:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/interactions", async (req, res) => {
  try {
    const medicationId = req.query.medicationId ? Number(req.query.medicationId) : undefined;
    let interactions;
    if (medicationId) {
      interactions = await db
        .select({
          id: foodDrugInteractionsTable.id,
          medicationId: foodDrugInteractionsTable.medicationId,
          food: foodDrugInteractionsTable.food,
          severity: foodDrugInteractionsTable.severity,
          description: foodDrugInteractionsTable.description,
          recommendation: foodDrugInteractionsTable.recommendation,
          medicationName: medicationsTable.name,
        })
        .from(foodDrugInteractionsTable)
        .leftJoin(medicationsTable, eq(foodDrugInteractionsTable.medicationId, medicationsTable.id))
        .where(eq(foodDrugInteractionsTable.medicationId, medicationId));
    } else {
      interactions = await db
        .select({
          id: foodDrugInteractionsTable.id,
          medicationId: foodDrugInteractionsTable.medicationId,
          food: foodDrugInteractionsTable.food,
          severity: foodDrugInteractionsTable.severity,
          description: foodDrugInteractionsTable.description,
          recommendation: foodDrugInteractionsTable.recommendation,
          medicationName: medicationsTable.name,
        })
        .from(foodDrugInteractionsTable)
        .leftJoin(medicationsTable, eq(foodDrugInteractionsTable.medicationId, medicationsTable.id));
    }
    res.json(interactions.map(i => ({ ...i, medicationName: i.medicationName ?? "" })));
  } catch (err) {
    console.error("Failed to get interactions:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
