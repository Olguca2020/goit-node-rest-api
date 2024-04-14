import jwt from "jsonwebtoken";
import { User } from "../models/user.js";

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token =
      authHeader &&
      authHeader.startsWith("Bearer ") &&
      authHeader.split(" ")[1];
    if (!token) {
      console.log("No token provided");
      return res.status(401).json({ message: "Not authorized" });
    }

    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
      if (err) {
        console.error("Token verification error:", err.message);
        return res.status(401).json({ message: "Not authorized" });
      }

      const user = await User.findById(decoded.userId);
      if (!user || token !== user.token) {
        console.log("User not found or token mismatch");
        return res.status(401).json({ message: "Not authorized" });
      }

      console.log("User authenticated:", user);
      req.user = user;
      next();
    });
  } catch (error) {
    console.error("Internal server error:", error.message);
    res.status(500).json({ message: "Server Error" });
  }
};

export default authenticateToken;
