import {
  decodeToken,
  TokenTypeEnum,
  UnauthorizedException,
} from "../common/index.js";

const extractToken = (authorization) => {
  const [schema, credentials, ...extra] = authorization.trim().split(" ");
  if (schema?.toLowerCase() !== "bearer" || !credentials || extra.length) {
    throw UnauthorizedException({ message: "Invalid authentication format" });
  }
  return credentials;
};

export const authentication = (tokenType = TokenTypeEnum.Access) => {
  return async (req, res, next) => {
    try {
      const { authorization } = req.headers;
      if (!authorization) {
        throw UnauthorizedException({
          message: "Missing authentication credentials",
        });
      }

      const { user, decoded } = await decodeToken({
        token: extractToken(authorization),
        tokenType,
      });

      req.user = user;
      req.decoded = decoded;
      return next();
    } catch (error) {
      return next(error);
    }
  };
};

export const optionalAuthentication = (tokenType = TokenTypeEnum.Access) => {
  const strict = authentication(tokenType);

  return (req, res, next) => {
    if (!req.headers.authorization) {
      return next();
    }

    return strict(req, res, next);
  };
};
