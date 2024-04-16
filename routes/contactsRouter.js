import express from "express";

import {
  getAllContacts,
  getOneContact,
  deleteContact,
  createContact,
  updateContact,
  updateStatusContact,
} from "../controllers/contactsControllers.js";
import authenticateToken from "../middleware/authenticateToken.js";

const contactsRouter = express.Router();

contactsRouter.get("/", authenticateToken, getAllContacts);

contactsRouter.get("/:id", authenticateToken, getOneContact);

contactsRouter.delete("/:id", authenticateToken, deleteContact);

contactsRouter.post("/", authenticateToken, createContact);

contactsRouter.put("/:id", authenticateToken, updateContact);

contactsRouter.patch("/:id/favorite", authenticateToken, updateStatusContact);

export default contactsRouter;
