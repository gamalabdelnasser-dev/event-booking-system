import {
  BadRequestException,
  decodeToken,
  TokenTypeEnum,
  UnauthorizedException,
} from "../Common/index.js";

export const authentication = (tokenType = TokenTypeEnum.Access) => {
  return async (req, res, next) => {
    const { authorization } = req.headers;
    const [schema, credentials] = authorization?.split(" ") || [];
    if (!schema || !credentials) {
      throw UnauthorizedException({
        message: `Missing authentication key or invalid approach`,
      });
    }
    if (schema != "Bearer") {
      throw BadRequestException({
        message: `Missing authentication schema   `,
      });
    }
    const { user, decoded } = await decodeToken({
      token: credentials,
      tokenType,
    });
    req.user = user;
    req.decoded = decoded;
    next();
  };
};
