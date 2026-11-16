import mongoose from "mongoose";
import { BookingModel, EventModel } from "../../DB/index.js";

// Create Booking
export const createBooking = async (eventId, userId, quantity) => {
  const session = await mongoose.startSession();
  let booking;

  await session.withTransaction(async () => {
    const event = await EventModel.findOneAndUpdate(
      {
        _id: eventId,
        status: "published",
        startAt: {
          $gt: new Date(Date.now() + 60 * 60 * 1000),
        },
        $expr: {
          $lte: [{ $add: ["$bookedSeats", quantity] }, "$capacity"],
        },
      },
      {
        $inc: { bookedSeats: quantity },
      },
      {
        new: true,
        session,
      },
    );
    if (!event) {
      throw createError("Event unavailable or not enough seats", 400);
    }
    const [newBooking] = await BookingModel.create(
      [
        {
          event: eventId,
          user: userId,
          quantity,
          totalPrice: event.price * quantity,
        },
      ],
      { session },
    );

    booking = newBooking;
  });

  return booking;
};

// Get My Bookings
export const getMyBookings = async (userId) => {
  return await BookingModel.find({
    user: userId,
  })
    .populate("event")
    .sort({ createdAt: -1 });
};

// Cancel Booking
export const cancelBooking = async (bookingId, userId) => {
  const session = await mongoose.startSession();

  let cancelledBooking;

  try {
    await session.withTransaction(async () => {
      const booking = await BookingModel.findOne({
        _id: bookingId,
        user: userId,
        status: "confirmed",
      }).session(session);

      if (!booking) {
        throw createError("Booking not found", 404);
      }

      const event = await EventModel.findById(booking.event).session(session);

      if (!event) {
        throw createError("Event not found", 404);
      }

      if (event.startAt <= new Date(Date.now() + 24 * 60 * 60 * 1000)) {
        throw createError(
          "Cancellation is allowed only 24 hours before the event",
          400,
        );
      }

      cancelledBooking = await BookingModel.findOneAndUpdate(
        {
          _id: bookingId,
          user: userId,
          status: "confirmed",
        },
        {
          $set: { status: "cancelled" },
        },
        {
          new: true,
          session,
        },
      );

      await EventModel.updateOne(
        { _id: event._id },
        {
          $inc: { bookedSeats: -booking.quantity },
        },
        { session },
      );
    });

    return cancelledBooking;
  } finally {
    await session.endSession();
  }
};
