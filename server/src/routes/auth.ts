import { Router } from "express";
import { pool } from "../db.js";
import { hashPassword, verifyPassword } from "../password.js";
import { signUserToken, requireUser, type AuthedRequest } from "../middleware/userAuth.js";

export const authRouter = Router();

function isValidEmail(email: unknown): email is string {
  return typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

authRouter.post("/register", async (req, res) => {
  const { email, password } = req.body ?? {};
  if (!isValidEmail(email)) {
    res.status(400).json({ error: "Введите корректный email" });
    return;
  }
  if (typeof password !== "string" || password.length < 6) {
    res.status(400).json({ error: "Пароль должен быть не короче 6 символов" });
    return;
  }

  const existing = await pool.query("SELECT id FROM users WHERE email = $1", [email.toLowerCase()]);
  if (existing.rows.length > 0) {
    res.status(409).json({ error: "Пользователь с таким email уже зарегистрирован" });
    return;
  }

  const { hash, salt } = await hashPassword(password);
  const { rows } = await pool.query("INSERT INTO users (email, password_hash, password_salt) VALUES ($1, $2, $3) RETURNING id", [
    email.toLowerCase(),
    hash,
    salt,
  ]);
  const userId = rows[0].id as number;
  const token = signUserToken(userId, email.toLowerCase());
  res.status(201).json({ token, email: email.toLowerCase() });
});

authRouter.post("/login", async (req, res) => {
  const { email, password } = req.body ?? {};
  if (!isValidEmail(email) || typeof password !== "string") {
    res.status(400).json({ error: "Введите email и пароль" });
    return;
  }

  const { rows } = await pool.query("SELECT id, password_hash, password_salt FROM users WHERE email = $1", [email.toLowerCase()]);
  if (rows.length === 0) {
    res.status(401).json({ error: "Неверный email или пароль" });
    return;
  }
  const user = rows[0];
  const ok = await verifyPassword(password, user.password_hash, user.password_salt);
  if (!ok) {
    res.status(401).json({ error: "Неверный email или пароль" });
    return;
  }
  const token = signUserToken(user.id, email.toLowerCase());
  res.json({ token, email: email.toLowerCase() });
});

authRouter.get("/me", requireUser, async (req: AuthedRequest, res) => {
  const { rows } = await pool.query("SELECT email FROM users WHERE id = $1", [req.userId]);
  if (rows.length === 0) {
    res.status(404).json({ error: "Пользователь не найден" });
    return;
  }
  res.json({ email: rows[0].email });
});
