import { ForbiddenException } from "../Common/index.js";

export const authorization = (accessRoles = []) => {
  return (req, res, next) => {
    if (!accessRoles.includes(req.user.role)) {
      throw ForbiddenException({ message: `Not authorized account` });
    }
    next();
  };
};
