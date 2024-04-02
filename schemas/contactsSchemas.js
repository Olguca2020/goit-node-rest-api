import Joi from "joi";

export const createContactSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  phone: Joi.string()
    .pattern(/^\d{10}$/)
    .required(),
});

export const updateContactSchema = Joi.object({
  id: Joi.string(),
  name: Joi.string(),
  email: Joi.string().email(),
  phone: Joi.string().pattern(/^\d{10}$/),
});
