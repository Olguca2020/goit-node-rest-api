import multer from "multer";
import path from "path";
import { nanoid } from "nanoid";
import { trusted } from "mongoose";
import HttpError from "../helpers/HttpError.js";
import Jimp from "jimp";
import fs from "fs/promises";

const multerStorage = multer.diskStorage({
  destination: (reg, file, cb) => {
    cb(null, path.join("tmp"));
  },
  filename: (req, file, cb) => {
    const extension = file.mimetype.split("/")[1];
    cb(null, `${req.user._id}-${nanoid()}.${extension}`);
  },
});
const multerFilter = (reg, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, trusted);
  } else {
    cb(new HttpError(400, "Please, upload image only.."), false);
  }
};
export const uploadAvatar = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
  limits: {
    fieldSize: 2 * 1024 * 1024,
  },
}).single("avatar");

export const updateAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Avatar file is required" });
    }
    const file = await Jimp.read(req.file.path);

    await file.resize(250, 250);

    const fileName = `${req.user._id}-${nanoid()}.${
      req.file.mimetype.split("/")[1]
    }`;

    const avatarPath = path.join("public", "avatars");

    await file.writeAsync(path.join(avatarPath, fileName));

    await fs.unlink(req.file.path);

    req.user.avatarURL = `/avatars/${fileName}`;

    await req.user.save();

    res.status(200).json({ avatarURL: req.user.avatarURL });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to update avatar" });
  }
};
