import mongoose from "mongoose";
import { BookingStatusEnum } from "../../common/enums/index.js";

const bookingSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    seats: { type: Number, required: true, min: 1, max: 5 },

    pricePerSeat: { type: Number, required: true, min: 0 },
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
bookingSchema.index({ event: 1, status: 1 });
bookingSchema.index({ user: 1, createdAt: -1 });

export const BookingModel =
  mongoose.models.Booking || mongoose.model("Booking", bookingSchema);
