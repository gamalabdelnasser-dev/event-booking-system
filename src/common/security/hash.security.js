import { hash, compare, genSalt } from "bcrypt";
import { SALT_ROUND } from "../../../config/config.service.js";

export const generateHash = async ({
  plainText,
  minor = "b",
  salt = SALT_ROUND,
}) => {
  const saltRound = await genSalt(SALT_ROUND, minor);

  return await hash(plainText, saltRound);
};
export const compareHash = async ({ plainText, hashedValue }) => {
  return await compare(plainText, hashedValue);
};
