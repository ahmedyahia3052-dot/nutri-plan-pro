import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import router from "./routes/index";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Startup environment validation ────────────────────────────────────────────
const REQUIRED_ENV = ["DATABASE_URL", "JWT_SECRET"] as const;
const missingEnv = REQUIRED_ENV.filter(k => !process.env[k]);
if (missingEnv.length > 0) {
  console.error("\n  ⛔  Missing required environment variables:");
  missingEnv.forEach(k => console.error(`       • ${k}`));
  console.error("\n  Copy .env.example to .env and fill in the values.\n  Run: npm run db:push && npm run db:seed\n");
  process.exit(1);
}

if (process.env.JWT_SECRET === "changeme_replace_with_64_random_characters_minimum") {
  console.warn("\n  ⚠️   JWT_SECRET is still the default placeholder value.");
  console.warn("       Generate a real secret: node -e \"console.log(require('crypto').randomBytes(64).toString('hex'))\"");
  console.warn("       This is a security risk. Update your .env before sharing or deploying.\n");
}

const app = express();
const port = parseInt(process.env.PORT ?? "3001", 10);

app.use(cors());
app.use(express.json({ limit: "2mb" }));

// ── API routes ────────────────────────────────────────────────────────────────
app.use("/api", router);

// ── Serve built frontend in production ───────────────────────────────────────
if (process.env.NODE_ENV === "production") {
  const staticDir = path.join(__dirname, "../dist/public");
  app.use(express.static(staticDir));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(staticDir, "index.html"));
  });
}

app.listen(port, () => {
  const env = process.env.NODE_ENV === "production" ? "production" : "development";
  console.log(`\n  Nutri Plan Pro API`);
  console.log(`  ─────────────────────────────`);
  console.log(`  Server  → http://localhost:${port}`);
  console.log(`  Health  → http://localhost:${port}/api/healthz`);
  console.log(`  Mode    → ${env}`);
  console.log(`  ─────────────────────────────\n`);
});
