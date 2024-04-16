import { Types } from "mongoose";
import HttpError from "../helpers/HttpError.js";

import { Contact } from "../models/contactModel.js";

export const getAllContacts = async (req, res, next) => {
  try {
    const contacts = await Contact.find({ owner: req.user._id });
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

    const contact = await Contact.findOne({ _id: id, owner: req.user._id });
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
    const deletedContact = await Contact.findOneAndDelete({
      _id: id,
      owner: req.user._id,
    });
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
    const { name, email, phone } = req.body;
    if (!name || !email || !phone) {
      const error = new Error("Bad Request: Missing required fields");
      error.status = 400;
      throw error;
    }
    const newContact = await Contact.create({
      name,
      email,
      phone,
      owner: req.user._id,
    });
    res.status(201).json(newContact);
  } catch (error) {
    next(error);
  }
};

export const updateContact = async (req, res, next) => {
  try {
    const { id } = req.params;
    const idIsValid = Types.ObjectId.isValid(id);
    if (!idIsValid) throw HttpError(404);
    const { name, email, phone } = req.body;
    if (!name || !email || !phone) {
      return res
        .status(400)
        .json({ message: "Body must have at least one field" });
    }
    const updateContact = await Contact.findOneAndUpdate(
      { _id: id, owner: req.user._id },
      req.body,
      { new: true }
    );
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
    if (!favorite) {
      return res
        .status(400)
        .json({ message: "Body must have at least one field" });
    }
    const updatedContact = await Contact.findOneAndUpdate(
      { _id: id, owner: req.user._id },
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
