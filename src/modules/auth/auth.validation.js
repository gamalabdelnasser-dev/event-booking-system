import { generalValidationFields } from "../../Common/index.js";
import joi from "joi";
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
      name: generalValidationFields.name,
      confirmPassword: generalValidationFields.confirmPassword().required(),
      role: generalValidationFields.role,
    })
    .required(),
};
