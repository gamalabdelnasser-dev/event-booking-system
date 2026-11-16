import joi from "joi";

export const createBookingSchema = {
  params: joi
    .object({
      id: joi.string().hex().length(24).required(),
    })
    .required(),

  body: joi
    .object({
      quantity: joi.number().integer().min(1).max(15).required(),
    })
    .required(),
};

export const cancelBookingSchema = {
  params: joi
    .object({
      id: joi.string().hex().length(24).required(),
    })
    .required(),
};
