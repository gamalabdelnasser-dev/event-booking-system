import mongoose from "mongoose";
import { BookingStatusEnum } from "../../common/enums/index.js";

const bookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    seats: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },

    totalPrice: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: Object.values(BookingStatusEnum),
      default: BookingStatusEnum.Confirmed,
    },
    cancelledAt: { type: Date },
  },
  { timestamps: true },
);

bookingSchema.index(
  { user: 1, event: 1 },
  {
    unique: true,
    partialFilterExpression: { status: BookingStatusEnum.Confirmed },
  },
);

bookingSchema.index({ user: 1, createdAt: -1 });

bookingSchema.index({ event: 1, status: 1 });

export const BookingModel =
  mongoose.models.Booking || mongoose.model("Booking", bookingSchema);
