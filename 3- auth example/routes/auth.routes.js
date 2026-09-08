import bcrypt from "bcrypt";
import express from "express";
import jwt from "jsonwebtoken";
import { createDB } from "../db.js";
import { validateBody } from "../middleware/validateBody.js";
import { loginSchema } from "../schema/auth/login.schema.js";
import { registerSchema } from "../schema/auth/register.schema.js";

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
    // is_verified: false
  });

  // send response with verify request
  res.status(201).json({
    message: "register successful, check you email for verification",
  });
});

authRouter.post("/login", validateBody(loginSchema), async (req, res) => {
  // validate ✅

  console.log(req.cookies.node_api_token);

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

  // generate token
  const token = jwt.sign(existingUser, process.env.JWT_SECRET);

  // send response
  res.cookie("node_api_token", token, {
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

authRouter.post("/logout", (req, res) => {
  res.clearCookie("node_api_token");
  return res.status(200).json({
    message: "logout successful",
  });
});
