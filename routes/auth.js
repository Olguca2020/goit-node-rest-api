import express from "express";

import Joi from "joi";
import bcrypt from "bcrypt";
import crypto from "crypto";

import { User } from "../models/user.js";
import jwt from "jsonwebtoken";
import authenticateToken from "../middleware/authenticateToken.js";
import { updateAvatar, uploadAvatar } from "../middleware/userMidleware.js";

const authRouter = express.Router();

const schema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

authRouter.post("/register", async (req, res) => {
  try {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const existingUser = await User.findOne({ email: req.body.email });
    if (existingUser) {
      return res.status(409).json({ message: "Email in use" });
    }

    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const emailHash = crypto
      .createHash("md5")
      .update(req.body.email.trim().toLowerCase())
      .digest("hex");
    const avatar = `https://gravatar.com/avatar/${emailHash}.jpg?d=retro`;
    const newUser = new User({
      email: req.body.email,
      password: hashedPassword,
      avatarURL: avatar,
    });
    await newUser.save();

    res.status(201).json({
      user: {
        email: newUser.email,
        subscription: "starter",
        avatar: newUser.avatarURL,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
});

authRouter.post("/login", async (req, res) => {
  try {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.status(401).json({ message: "Email or password is wrong" });
    }

    const passwordMatch = await bcrypt.compare(
      req.body.password,
      user.password
    );
    if (!passwordMatch) {
      return res.status(401).json({ message: "Email or password is wrong" });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    user.token = token;
    await user.save();

    res.status(200).json({
      token,
      user: {
        email: user.email,
        subscription: user.subscription,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
});

authRouter.post("/logout", authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({ message: "Not authorized" });
    }
    user.token = null;
    await user.save();
    res.status(204).end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
});

authRouter.get("/current", authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(401).json({ message: "Not authorized" });
    }

    res.status(200).json({
      email: user.email,
      subscription: user.subscription,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
});

authRouter.patch(
  "/avatars",
  authenticateToken,
  uploadAvatar,
  updateAvatar,
  async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Not authorized" });
      }
      if (!req.user.avatarURL) {
        return res.status(500).json({ message: "Failed to update avatar" });
      }
      res.status(200).json({ avatarURL: req.user.avatarURL });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server Error" });
    }
  }
);

export default authRouter;
