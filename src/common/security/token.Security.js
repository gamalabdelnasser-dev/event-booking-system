import jwt from "jsonwebtoken";

import {
  ACCESS_TOKEN_EXPIRES_IN,
  ADMIN_ACCESS_TOKEN_SECRET_KEY,
  ADMIN_REFRESH_TOKEN_SECRET_KEY,
  REFRESH_TOKEN_EXPIRES_IN,
  USER_ACCESS_TOKEN_SECRET_KEY,
  USER_REFRESH_TOKEN_SECRET_KEY,
} from "../../../config/config.service.js";
import { TokenTypeEnum } from "../enums/security.enum.js";
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from "../response/index.js";
import { findOne, UserModel } from "../../DB/index.js";
import { UserRoleEnum } from "../enums/user.enum.js";

export const generateToken = async ({
  payload = {},
  secret = USER_ACCESS_TOKEN_SECRET_KEY,
  options = {},
}) => {
  return jwt.sign(payload, secret, options);
};

export const verifyToken = async ({
  token = "",
  secret = USER_ACCESS_TOKEN_SECRET_KEY,
}) => {
  return jwt.verify(token, secret);
};

export const decodeToken = async ({
  token,
  tokenType = TokenTypeEnum.Access,
}) => {
  const decoded = jwt.decode(token);
  const [roleType, TokenType] = decoded.aud;
  if (!decoded?.aud?.length) {
    throw BadRequestException({ message: "Missing token audience" });
  }

  if (tokenType != TokenType) {
    throw ConflictException({ message: "Unexpected Token mechanism " });
  }

  const { accessSignature } = await getTokenSignature(roleType);

  const verifiedData = await verifyToken({ token, secret: accessSignature });

  const user = await findOne({
    model: UserModel,
    filters: { _id: verifiedData.sub },
  });
  if (!user) {
    throw NotFoundException("No register account ");
  }

  return { user, decoded };
};

export const getTokenSignature = async (userRole) => {
  let accessSignature = undefined;
  let refreshSignature = undefined;

  switch (userRole) {
    case UserRoleEnum.Admin:
      accessSignature = ADMIN_ACCESS_TOKEN_SECRET_KEY;
      refreshSignature = ADMIN_REFRESH_TOKEN_SECRET_KEY;
      break;
    default:
      accessSignature = USER_ACCESS_TOKEN_SECRET_KEY;
      refreshSignature = USER_REFRESH_TOKEN_SECRET_KEY;
      break;
  }
  return { accessSignature, refreshSignature };
};

export const createLoginCredentials = async (user, issuer) => {
  const { accessSignature, refreshSignature } = await getTokenSignature(
    user.role,
  );

  const access_token = await generateToken({
    payload: { sub: user._id },
    secret: accessSignature,
    options: {
      audience: [user.role, TokenTypeEnum.Access],
      issuer,
      expiresIn: ACCESS_TOKEN_EXPIRES_IN,
    },
  });

  const refresh_token = await generateToken({
    payload: { sub: user._id },
    secret: refreshSignature,
    options: {
      audience: [user.role, TokenTypeEnum.Refresh],
      issuer,
      expiresIn: REFRESH_TOKEN_EXPIRES_IN,
    },
  });
  return { access_token, refresh_token };
};
