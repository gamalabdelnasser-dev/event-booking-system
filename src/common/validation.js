import joi from "joi";
import { UserRoleEnum } from "./enums/index.js";

export const generalValidationFields = {
  name: joi.string().trim().min(2).max(50),
  email: joi.string().trim().lowercase().email(),

  password: joi
    .string()
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*\W).{8,64}$/)
    .messages({
      "string.pattern.base":
        "Password must be 8-64 chars with upper, lower, number and special character",
    }),

  confirmPassword: function (path = "password") {
    return joi.string().valid(joi.ref(path)).messages({
      "any.only": "Passwords do not match",
      "any.required": "Confirm password is required",
    });
  },

  role: joi
    .string()
    .valid(UserRoleEnum.User, UserRoleEnum.Organizer)
    .default(UserRoleEnum.User),

  title: joi.string().trim().min(3).max(100),
  description: joi.string().trim().min(10),
  category: joi.string().trim(),
  location: joi.string().trim(),
  isOnline: joi.boolean(),
  startAt: joi.date().greater("now"),
  capacity: joi.number().integer().min(1),
  price: joi.number().min(0),

  id: joi.string().hex().length(24),
  seats: joi.number().integer().min(1).max(5),
  page: joi.number().integer().min(1).default(1),
  limit: joi.number().integer().min(1).max(100).default(10),
  date: joi.date(),
};
