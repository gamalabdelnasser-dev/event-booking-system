import joi from "joi";
import { generalValidationFields } from "../../Common/index.js";

export const loginSchema = {
  body: joi
    .object({
      email: generalValidationFields.email.required(),
      password: generalValidationFields.password.required(),
    })
    .required(),
};

export const signupSchema = {
  body: loginSchema.body
    .append({
      name: generalValidationFields.name.required(),
      confirmPassword: generalValidationFields.confirmPassword().required(),
      role: generalValidationFields.role,
    })
    .required(),
};
