import bcrypt from "bcrypt";
import express from "express";
import { createDB } from "../db.js";
import { validateBody } from "../middleware/validateBody.js";
import { loginSchema } from "../schema/auth/login.schema.js";
import { registerSchema } from "../schema/auth/register.schema.js";
import crypto from "crypto"

process.loadEnvFile();

export const authRouter = express.Router();
const db = createDB();

authRouter.post("/register", validateBody(registerSchema), async (req, res) => {
  // validate data ✅

  // hash password ✅
  const passwordHash = await bcrypt.hash(req.body.password, 10);

  // check email is unique
  const authUsers = await db.getAll("auth_users");
  const existingUser = authUsers.find((u) => u.email === req.body.email);

  if (existingUser) {
    return res.status(422).json({
      error: "email already in use",
    });
  }

  // add data to DB
  await db.create("auth_users", {
    email: req.body.email,
    username: req.body.username,
    passwordHash: passwordHash,
    role: req.body.role
    // is_verified: false
  });

  // send response with verify request
  res.status(201).json({
    message: "register successful, check you email for verification",
  });
});

authRouter.post("/login", validateBody(loginSchema), async (req, res) => {
  // validate ✅

  // get user by email ✅
  const auth_users = await db.getAll("auth_users");
  const existingUser = auth_users.find((u) => u.email === req.body.email);

  if (!existingUser) {
    return res.status(422).json({
      error: "email or password are invalid",
    });
  }

  // compare passwords

  const isValid = await bcrypt.compare(
    req.body.password,
    existingUser.passwordHash,
  );

  if (!isValid) {
    return res.status(422).json({
      error: "email or password are invalid",
    });
  }

  // check email verification

  // generate session
  const session = {
    email: existingUser.email,
    id: existingUser.id,
    role: existingUser.role
  }

  const session_id = crypto.randomBytes(16).toString("hex")

  await db.create("sessions", {session_id: session_id, ...session})

  // send response
  res.cookie("node_session_id", session_id, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 1000,
  });

  return res.status(200).json({
    message: "login successful",
    data: {
      user: existingUser,
    },
  });
});

authRouter.post("/logout", async (req, res) => {
  res.clearCookie("node_session_id");

  const sessionid = req.cookies.node_session_id
  const sessions = await db.getAll("sessions")

  const session = sessions.find(s => s.session_id == sessionid)

  await db.delete("sessions",session.id)

  return res.status(200).json({
    message: "logout successful",
  });
});
