import express from "express";
import { SERVER_PORT } from "../config/config.service.js";
import { connectDB } from "./DB/index.js";
import { globalErrorHandling } from "./middlewares/index.js";
import { bookingRouter, eventsRouter, userRouter } from "./modules/index.js";

export const bootstrap = async () => {
  const app = express();
  app.use(express.json());

  app.use("/api/auth", userRouter);
  app.use("/api/events", eventsRouter);
  app.use("/api/bookings", bookingRouter);
  await connectDB();

  app.use("{/*dummy}", (req, res) => {
    return NotFoundException({
      message: `Page is not found with URL ${req.originalUrl}&& METHOD ${req.method}`,
    });
  });
  app.use(globalErrorHandling);
  app.listen(SERVER_PORT, () => {
    console.log(`Server is Running on port ${SERVER_PORT}`);
  });
};
