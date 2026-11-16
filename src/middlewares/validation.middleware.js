import joi from "joi";
import { BadRequestException } from "../Common/index.js";

export const validation = (schema) => {
  return (req, res, next) => {
    const errors = [];
    for (const key of Object.keys(schema)) {
      const validationResult = schema[key].validate(req[key], {});
      if (validationResult.error) {
        errors.push({
          key,
          details: validationResult.error.details.map((el) => {
            return { path: el.path, message: el.message };
          }),
        });
      }
    }
    if (errors.length > 0) {
      throw BadRequestException({
        message: `Validations Errors`,
        extra: errors,
      });
    }
    next();
  };
};
