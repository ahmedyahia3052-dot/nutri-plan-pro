import { Router } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable } from "../db/index";
import { eq } from "drizzle-orm";
import { requireAuth, signToken } from "../middleware/auth";
import { z } from "zod";

const router = Router();

const RegisterSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(8),
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post("/auth/register", async (req, res) => {
  const parsed = RegisterSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors[0].message });
    return;
  }
  const { name, email, password } = parsed.data;
  try {
    const existing = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase())).limit(1);
    if (existing.length > 0) {
      res.status(409).json({ error: "An account with that email already exists." });
      return;
    }
    const passwordHash = await bcrypt.hash(password, 12);
    const inserted = await db.insert(usersTable).values({
      name,
      email: email.toLowerCase(),
      passwordHash,
    }).returning();
    const user = inserted[0];
    const token = signToken({ id: user.id, email: user.email, name: user.name });
    res.status(201).json({ token, user: { id: user.id, email: user.email, name: user.name } });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

router.post("/auth/login", async (req, res) => {
  const parsed = LoginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors[0].message });
    return;
  }
  const { email, password } = parsed.data;
  try {
    const users = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase())).limit(1);
    if (users.length === 0) {
      res.status(401).json({ error: "Invalid email or password." });
      return;
    }
    const user = users[0];
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Invalid email or password." });
      return;
    }
    const token = signToken({ id: user.id, email: user.email, name: user.name });
    res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

router.get("/auth/me", requireAuth, (req, res) => {
  res.json(req.user!);
});

export default router;
