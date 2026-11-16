import jwt from "jsonwebtoken";
import {
  ACCESS_TOKEN_EXPIRES_IN,
  ADMIN_ACCESS_TOKEN_SECRET_KEY,
  ADMIN_REFRESH_TOKEN_SECRET_KEY,
  ISSUER,
  REFRESH_TOKEN_EXPIRES_IN,
  USER_ACCESS_TOKEN_SECRET_KEY,
  USER_REFRESH_TOKEN_SECRET_KEY,
} from "../../../config/config.service.js";
import { TokenTypeEnum, UserRoleEnum } from "../enums/index.js";
import { UnauthorizedException } from "../response/error.response.js";
import { findOne, UserModel } from "../../DB/index.js";

// Generate JWT
export const generateToken = async ({
  payload = {},
  secret = USER_ACCESS_TOKEN_SECRET_KEY,
  options = {},
}) => {
  return jwt.sign(payload, secret, { algorithm: "HS256", ...options });
};

// Verify JWT
export const verifyToken = async ({
  token = "",
  secret = USER_ACCESS_TOKEN_SECRET_KEY,
}) => {
  return jwt.verify(token, secret, { algorithms: ["HS256"] });
};

// Get JWT Signatures
export const getTokenSignature = async (userRole) => {
  switch (userRole) {
    case UserRoleEnum.Admin:
      return {
        accessSignature: ADMIN_ACCESS_TOKEN_SECRET_KEY,
        refreshSignature: ADMIN_REFRESH_TOKEN_SECRET_KEY,
      };
    default:
      return {
        accessSignature: USER_ACCESS_TOKEN_SECRET_KEY,
        refreshSignature: USER_REFRESH_TOKEN_SECRET_KEY,
      };
  }
};

// Decode and validate JWT
export const decodeToken = async ({
  token,
  tokenType = TokenTypeEnum.Access,
}) => {
  if (!token) throw UnauthorizedException({ message: "Token is required" });

  const decoded = jwt.decode(token);
  if (
    !decoded ||
    typeof decoded === "string" ||
    !Array.isArray(decoded.aud) ||
    decoded.aud.length !== 2
  ) {
    throw UnauthorizedException({ message: "Invalid token" });
  }

  const [roleType, decodedTokenType] = decoded.aud;
  if (
    !Object.values(UserRoleEnum).includes(roleType) ||
    decodedTokenType !== tokenType
  ) {
    throw UnauthorizedException({ message: "Invalid token" });
  }

  const { accessSignature, refreshSignature } =
    await getTokenSignature(roleType);
  const secret =
    decodedTokenType === TokenTypeEnum.Access
      ? accessSignature
      : refreshSignature;

  const verifiedData = await verifyToken({ token, secret });

  const user = await findOne({
    model: UserModel,
    filters: { _id: verifiedData.sub },
    select: "-password -__v",
  });
  if (!user || user.role !== roleType) {
    throw UnauthorizedException({ message: "Invalid token" });
  }

  return { user, decoded: verifiedData };
};

// Create Login Credentials
export const createLoginCredentials = async (user) => {
  const { accessSignature, refreshSignature } = await getTokenSignature(
    user.role,
  );
  const sub = user._id.toString();

  const access_token = await generateToken({
    payload: { sub },
    secret: accessSignature,
    options: {
      audience: [user.role, TokenTypeEnum.Access],
      issuer: ISSUER,
      expiresIn: ACCESS_TOKEN_EXPIRES_IN,
    },
  });

  const refresh_token = await generateToken({
    payload: { sub },
    secret: refreshSignature,
    options: {
      audience: [user.role, TokenTypeEnum.Refresh],
      issuer: ISSUER,
      expiresIn: REFRESH_TOKEN_EXPIRES_IN,
    },
  });

  return { access_token, refresh_token };
};
