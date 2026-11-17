import joi from "joi";
import { generalValidationFields } from "../../Common/index.js";

// POST /api/events/:id/bookings
export const createBookingSchema = {
  params: joi.object({ id: generalValidationFields.id.required() }).required(),
  body: joi
    .object({ seats: generalValidationFields.seats.required() })
    .required(),
};

// PATCH /api/bookings/:id/cancel
export const cancelBookingSchema = {
  params: joi.object({ id: generalValidationFields.id.required() }).required(),
};
