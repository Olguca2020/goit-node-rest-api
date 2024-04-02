import contactsService from "../services/contactsServices.js";
import HttpError from "../helpers/HttpError.js";
import {
  createContactSchema,
  updateContactSchema,
} from "../schemas/contactsSchemas.js";
import { json } from "express";

export const getAllContacts = async (_req, res, next) => {
  try {
    const contacts = await contactsService.listContacts();
    res.status(200).json(contacts);
  } catch (error) {
    console.log(error);
    next(new HttpError(500));
  }
};

export const getOneContact = async (req, res, next) => {
  try {
    const { id } = req.params;
    const contact = await contactsService.getContactById(id);
    if (contact) {
      res.status(200).json(contact);
    } else {
      throw HttpError(404);
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
};

export const deleteContact = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deletedContact = await contactsService.removeContact(id);
    if (!deleteContact) {
      throw HttpError(404);
    }
    res.status(200).json(deletedContact);
  } catch (error) {
    next(error);
  }
};

export const createContact = async (req, res, next) => {
  try {
    const { name, email, phone } = req.body;
    if (!name && !email && !phone) {
      return res
        .status(400)
        .json({ message: "Body must have at least one field" });
    }

    const { error } = createContactSchema.validate({ name, email, phone });
    if (error) {
      throw HttpError(400);
    }
    const newContact = await contactsService.addContact({ name, email, phone });
    res.status(201).json(newContact);
  } catch (error) {
    next(error);
  }
};

export const updateContact = async (req, res, next) => {
  try {
    const { error } = updateContactSchema.validate(req.body);
    if (error) {
      throw HttpError(400);
    }
    const { id } = req.params;
    const updateContact = await contactsService.updateContact(id, req.body);
    if (!updateContact) {
      throw HttpError(404);
    }
    res.status(200).json(updateContact);
  } catch (error) {
    next(error);
  }
};
