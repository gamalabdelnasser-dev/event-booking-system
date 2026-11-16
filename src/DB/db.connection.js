import mongoose from "mongoose";
import { DB_URI_LOCAL } from "../../config/config.service.js";

export const connectDB = async () => {
  try {
    await mongoose.connect(DB_URI_LOCAL);
    console.log("DB connected successfully");
  } catch (error) {
    console.error("DB connection failed:", error.message);
  }
};
