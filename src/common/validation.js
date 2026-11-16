import joi from "joi";
import { UserRoleEnum } from "./enums/index.js";

export const generalValidationFields = {
  name: joi.string().trim().min(2).max(50).required(),
  email: joi
    .string()
    .pattern(
      new RegExp(/^[a-z]{1,100}@(gmail|yahoo|icloud)(.com|.net|.edu){1,2}$/),
    )
    .email({
      minDomainSegments: 2,
      maxDomainSegments: 3,
      tlds: { allow: ["com", "net"] },
    })
    .lowercase()
    .trim()
    .required(),

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
};
