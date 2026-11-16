import {
  compareHash,
  ConflictException,
  createLoginCredentials,
  generateHash,
  NotFoundException,
  UnauthorizedException,
  UserRoleEnum,
} from "../../Common/index.js";
import { createOne, findOne, UserModel } from "../../DB/index.js";

export const signup = async (bodyData) => {
  const { name, password, email, role } = bodyData;

  const user = await findOne({ model: UserModel, filters: { email } });
  if (user) {
    throw ConflictException({ message: "User Already Exist" });
  }

  const newUser = await createOne({
    model: UserModel,
    data: {
      name,
      password: await generateHash({ plainText: password }),
      email,
      role: role ?? UserRoleEnum.User,
    },
  });

  return newUser;
};

export const login = async (bodyData, issuer) => {
  const { email, password } = bodyData;

  const user = await findOne({
    model: UserModel,
    filters: {
      email,
    },
  });

  if (!user) {
    throw NotFoundException({ message: `Invalid Login Credentials` });
  }

  if (
    !(await compareHash({ plainText: password, hashedValue: user.password }))
  ) {
    throw UnauthorizedException({ message: `Invalid Login Credentials ` });
  }

  return await createLoginCredentials(user, issuer);
};

export const me = async (token) => {
  const { email } = token;
  const user = await findOne({
    model: UserModel,
    filters: { email },
    select: "-_id -password -__v -createdAt -updatedAt",
  });
  return user;
};
