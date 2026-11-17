import {
  BadRequestException,
  BookingStatusEnum,
  ConflictException,
  EventStatusEnum,
  NotFoundException,
} from "../../Common/index.js";
import { BookingModel, EventModel } from "../../DB/index.js";

const ONE_DAY = 24 * 60 * 60 * 1000;

export const createBooking = async (eventId, user, seats) => {
  seats = Number(seats);

  const oldBooking = await BookingModel.findOne({
    user: user._id,
    event: eventId,
    status: BookingStatusEnum.Confirmed,
  });
  if (oldBooking) {
    throw ConflictException({
      message: "You already have an active booking for this event",
    });
  }

  const event = await EventModel.findOneAndUpdate(
    {
      _id: eventId,
      status: EventStatusEnum.Published,
      startAt: { $gt: new Date() },
      $expr: { $lte: [{ $add: ["$bookedSeats", seats] }, "$capacity"] },
    },
    { $inc: { bookedSeats: seats } },
    { new: true },
  );

  if (!event) {
    const existing = await EventModel.findById(eventId);
    if (!existing) throw NotFoundException({ message: "Event not found" });
    if (existing.status !== EventStatusEnum.Published) {
      throw BadRequestException({ message: "Event is not open for booking" });
    }
    if (existing.startAt <= new Date()) {
      throw BadRequestException({ message: "Event has already started" });
    }
    throw ConflictException({ message: "Not enough seats available" });
  }

  try {
    const booking = await BookingModel.create({
      user: user._id,
      event: event._id,
      seats,
      totalPrice: seats * event.price, // السعر وقت الحجز
    });
    return booking;
  } catch (error) {
    await EventModel.updateOne(
      { _id: event._id },
      { $inc: { bookedSeats: -seats } },
    );
    if (error.code === 11000) {
      throw ConflictException({
        message: "You already have an active booking for this event",
      });
    }
    throw error;
  }
};

export const getMyBookings = async (user) => {
  const bookings = await BookingModel.find({ user: user._id })
    .populate("event", "title startAt location isOnline status")
    .sort({ createdAt: -1 });
  return bookings;
};

export const cancelBooking = async (bookingId, user) => {
  const booking = await BookingModel.findOne({
    _id: bookingId,
    user: user._id,
  });
  if (!booking) throw NotFoundException({ message: "Booking not found" });

  if (booking.status === BookingStatusEnum.Cancelled) {
    throw ConflictException({ message: "Booking is already cancelled" });
  }

  const event = await EventModel.findById(booking.event);
  if (event.startAt.getTime() - Date.now() < ONE_DAY) {
    throw BadRequestException({
      message: "You can cancel only up to 24 hours before the event",
    });
  }

  const cancelled = await BookingModel.findOneAndUpdate(
    { _id: booking._id, status: BookingStatusEnum.Confirmed },
    { status: BookingStatusEnum.Cancelled, cancelledAt: new Date() },
    { new: true },
  );
  if (!cancelled) {
    throw ConflictException({ message: "Booking is already cancelled" });
  }

  await EventModel.updateOne(
    { _id: booking.event },
    { $inc: { bookedSeats: -booking.seats } },
  );

  return cancelled;
};
