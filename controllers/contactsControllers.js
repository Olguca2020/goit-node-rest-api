import { Types } from "mongoose";
import HttpError from "../helpers/HttpError.js";

import { Contact } from "../models/contactModel.js";

export const getAllContacts = async (_req, res, next) => {
  try {
    const contacts = await Contact.find();
    res.status(200).json(contacts);
  } catch (error) {
    console.log(error);
    next(new HttpError(500));
  }
};

export const getOneContact = async (req, res, next) => {
  try {
    const { id } = req.params;
    const idIsValid = Types.ObjectId.isValid(id);
    if (!idIsValid) throw HttpError(404);
    const contact = await Contact.findById(id);
    if (!contact) throw HttpError(404);
    res.status(200).json(contact);
  } catch (error) {
    console.log(error);
    next(error);
  }
};

export const deleteContact = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deletedContact = await Contact.findByIdAndDelete(id);
    if (!deletedContact) {
      throw HttpError(404);
    }
    res.status(200).json(deletedContact);
  } catch (error) {
    next(error);
  }
};

export const createContact = async (req, res, next) => {
  try {
    const { name, email, phone, favorite } = req.body;

    const newContact = await Contact.create({ name, email, phone, favorite });
    res.status(201).json(newContact);
  } catch (error) {
    next(error);
  }
};

export const updateContact = async (req, res, next) => {
  try {
    const { name, email, phone, favorite } = req.body;
    if (!name || !email || !phone || !favorite) {
      return res
        .status(400)
        .json({ message: "Body must have at least one field" });
    }

    const { id } = req.params;
    const updateContact = await Contact.findByIdAndUpdate(id, req.body);
    if (!updateContact) {
      throw HttpError(404);
    }
    res.status(200).json(updateContact);
  } catch (error) {
    next(error);
  }
};

export const updateStatusContact = async (req, res, next) => {
  try {
    const { id } = req.params;
    const idIsValid = Types.ObjectId.isValid(id);
    if (!idIsValid) throw HttpError(404);
    const { favorite } = req.body;
    const updatedContact = await Contact.findByIdAndUpdate(
      id,
      { favorite },
      { new: true }
    );
    if (!updatedContact) {
      throw HttpError(404);
    }
    res.status(200).json(updatedContact);
  } catch (er) {
    next(er);
  }
};
