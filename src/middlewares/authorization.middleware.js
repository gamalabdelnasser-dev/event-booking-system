import { ForbiddenException, UnauthorizedException } from "../common/index.js";

export const authorization = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(UnauthorizedException({ message: "Not authenticated" }));
    }
    if (!allowedRoles.includes(req.user.role)) {
      return next(
        ForbiddenException({
          message: "You are not allowed to do this action",
        }),
      );
    }
    return next();
  };
};
