import mongoose from "mongoose";
import { EventStatusEnum } from "../../common/enums/index.js";

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minLength: 3,
      maxLength: 100,
    },
    description: { type: String, required: true, trim: true, minLength: 10 },
    category: { type: String, required: true, trim: true },
    location: { type: String, trim: true },
    isOnline: { type: Boolean, default: false },
    startAt: { type: Date, required: true },
    capacity: { type: Number, required: true, min: 1 },
    bookedSeats: { type: Number, default: 0, min: 0 },
    price: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: Object.values(EventStatusEnum),
      default: EventStatusEnum.Draft,
    },
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

eventSchema.pre("validate", function () {
  if (!this.isOnline && !this.location) {
    this.invalidate("location", "Location is required for non-online events");
  }
});

eventSchema.index({ status: 1, startAt: 1 });
eventSchema.index({ organizer: 1 });
eventSchema.index({ category: 1 });
eventSchema.index({ title: 1 });

export const EventModel =
  mongoose.models.Event || mongoose.model("Event", eventSchema);
