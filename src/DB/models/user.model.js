import mongoose from "mongoose";
import { UserRoleEnum } from "../../Common/index.js";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minLength: 2,
      maxLength: 50,
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: [true, "Password is required"],
    },

    role: {
      type: String,
      enum: Object.values(UserRoleEnum),
      default: UserRoleEnum.User,
    },
  },
  {
    timestamps: true,
  },
);

export const UserModel =
  mongoose.models.User || mongoose.model("User", userSchema);
