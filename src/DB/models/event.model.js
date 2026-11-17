import mongoose from "mongoose";
import { EventStatusEnum } from "../../Common/index.js";

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Event title is required"],
      trim: true,
      minLength: 3,
      maxLength: 100,
    },
    description: {
      type: String,
      required: [true, "Event description is required"],
      trim: true,
    },
    category: {
      type: String,
      required: [true, "Event category is required"],
      trim: true,
    },
    location: {
      type: String,
      trim: true,
      required: function () {
        return !this.isOnline;
      },
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
    startAt: {
      type: Date,
      required: [true, "Event start date is required"],
    },
    capacity: {
      type: Number,
      required: [true, "Event capacity is required"],
      min: 1,
    },
    status: {
      type: String,
      enum: Object.values(EventStatusEnum),
      default: EventStatusEnum.Draft,
    },
    bookedSeats: {
      type: Number,
      default: 0,
      min: 0,
    },
    price: {
      type: Number,
      required: [true, "Event price is required"],
      min: 0,
    },
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

export const EventModel =
  mongoose.models.Event || mongoose.model("Event", eventSchema);
