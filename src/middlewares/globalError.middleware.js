import { NODE_ENV } from "../../config/config.service.js";

export const globalErrorHandling = (error, req, res, next) => {
  const status = error.cause?.statusCode ?? 500;
  const mood = NODE_ENV == "production";
  const defaultErrorMessage = "something went wrong Sever error";
  const displayErrorMessage = error.message || defaultErrorMessage;

  return res.status(status).json({
    status,
    errorMessage: mood
      ? status == 500
        ? defaultErrorMessage
        : displayErrorMessage
      : displayErrorMessage,
    stack: mood ? undefined : error.stack,

    extra: error?.cause?.extra || undefined,
  });
};
