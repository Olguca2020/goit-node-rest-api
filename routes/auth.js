import express from "express";

import Joi from "joi";
import bcrypt from "bcrypt";
import crypto from "crypto";

import { User } from "../models/user.js";
import jwt from "jsonwebtoken";
import authenticateToken from "../middleware/authenticateToken.js";
import { updateAvatar, uploadAvatar } from "../middleware/userMidleware.js";
import { nanoid } from "nanoid";
import nodemailer from "nodemailer";

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
    const verificationToken = nanoid();
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
      verificationToken: verificationToken,
    });
    await newUser.save();

    await sendVerificationEmail(
      newUser.email,
      verificationToken,
      req.protocol,
      req.get("host")
    );
    res.status(201).json({
      user: {
        email: newUser.email,
        subscription: "starter",
        avatar: newUser.avatarURL,
        verificationToken: newUser.verificationToken,
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

authRouter.get("/verify/:verificationToken", async (req, res) => {
  try {
    const { verificationToken } = req.params;
    const user = await User.findOne({ verificationToken });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.verificationToken = null;
    user.verify = true;
    await user.save();

    res.status(200).json({ message: "Verification successful" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
});

const sendVerificationEmail = async (
  email,
  verificationToken,
  protocol,
  host
) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.meta.ua",
      port: 465,
      secure: true,
      auth: {
        user: "olguca@meta.ua",
        pass: process.env.META_PASSWORD,
      },
    });

    const verificationLink = `${protocol}://${host}/users/verify/${verificationToken}`;

    const mailOptions = {
      from: "olguca@meta.ua",
      to: email,
      subject: "Email Verification",
      html: `<p>Please click the following link to verify your email: <a href="${verificationLink}">${verificationLink}</a></p>`,
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Error sending verification email:", error);
  }
};

authRouter.post("/verify", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Missing required field email" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.verify) {
      return res
        .status(400)
        .json({ message: "Verification has already been passed" });
    }

    await sendVerificationEmail(user.email, user.verificationToken);

    res.status(200).json({ message: "Verification email sent" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
});

export default authRouter;
