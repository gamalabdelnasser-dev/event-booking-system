import {
  BadRequestException,
  BookingStatusEnum,
  ConflictException,
  EventStatusEnum,
  ForbiddenException,
  NotFoundException,
  UserRoleEnum,
} from "../../Common/index.js";
import { BookingModel, EventModel } from "../../DB/index.js";

export const createEvent = async (body, user) => {
  const event = await EventModel.create({ ...body, organizer: user._id });
  return {
    ...event.toObject(),
    availableSeats: event.capacity - event.bookedSeats,
  };
};

export const listEvents = async (query, user) => {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const skip = (page - 1) * limit;

  const filters = {};

  if (user?.role === UserRoleEnum.Admin) {
  } else if (user?.role === UserRoleEnum.Organizer) {
    filters.$or = [
      { status: EventStatusEnum.Published },
      { organizer: user._id },
    ];
  } else {
    filters.status = EventStatusEnum.Published;
  }

  if (query.search) {
    const text = query.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filters.title = { $regex: text, $options: "i" };
  }

  if (query.category) {
    filters.category = query.category;
  }

  if (query.from || query.to) {
    filters.startAt = {};
    if (query.from) filters.startAt.$gte = new Date(query.from);
    if (query.to) filters.startAt.$lte = new Date(query.to);
  }

  const sortField = query.sortBy === "price" ? "price" : "startAt";
  const sortOrder = query.order === "desc" ? -1 : 1;

  const events = await EventModel.find(filters)
    .sort({ [sortField]: sortOrder })
    .skip(skip)
    .limit(limit)
    .lean();
  const total = await EventModel.countDocuments(filters);

  const result = events.map((e) => ({
    ...e,
    availableSeats: e.capacity - e.bookedSeats,
  }));

  return { events: result, total, page, limit };
};

export const getEvent = async (id, user) => {
  const event = await EventModel.findById(id);
  if (!event) throw NotFoundException({ message: "Event not found" });

  const isOwner = user && event.organizer.equals(user._id);
  const isAdmin = user?.role === UserRoleEnum.Admin;

  if (event.status !== EventStatusEnum.Published && !isOwner && !isAdmin) {
    throw NotFoundException({ message: "Event not found" });
  }

  return {
    ...event.toObject(),
    availableSeats: event.capacity - event.bookedSeats,
  };
};

export const updateEvent = async (id, body, user) => {
  const event = await EventModel.findById(id);
  if (!event) throw NotFoundException({ message: "Event not found" });

  const isOwner = event.organizer.equals(user._id);
  const isAdmin = user.role === UserRoleEnum.Admin;
  if (!isOwner && !isAdmin) {
    throw ForbiddenException({ message: "You can only edit your own events" });
  }

  if (event.status === EventStatusEnum.Cancelled) {
    throw ConflictException({ message: "Cancelled event can't be edited" });
  }

  // لو بقت مش أونلاين لازم يكون فيه مكان
  const finalIsOnline = body.isOnline ?? event.isOnline;
  const finalLocation = body.location ?? event.location;
  if (!finalIsOnline && !finalLocation) {
    throw BadRequestException({
      message: "Location is required for non-online events",
    });
  }

  // الشروط جوه الـ query نفسها عشان تبقى atomic مع أي حجز بيحصل في نفس اللحظة
  const filter = { _id: id, status: { $ne: EventStatusEnum.Cancelled } };

  if (body.capacity !== undefined) {
    filter.bookedSeats = { $lte: body.capacity };
  }
  if (body.status === EventStatusEnum.Draft) {
    filter.bookedSeats = { ...(filter.bookedSeats ?? {}), $lte: 0 };
    if (body.capacity !== undefined) filter.bookedSeats.$lte = 0; // الأضيق يكسب
  }

  const updated = await EventModel.findOneAndUpdate(
    filter,
    { $set: body },
    { new: true, runValidators: true },
  );

  if (!updated) {
    // نعرف السبب عشان نرجّع رسالة واضحة
    const fresh = await EventModel.findById(id);
    if (!fresh) throw NotFoundException({ message: "Event not found" });
    if (fresh.status === EventStatusEnum.Cancelled) {
      throw ConflictException({ message: "Cancelled event can't be edited" });
    }
    if (body.status === EventStatusEnum.Draft && fresh.bookedSeats > 0) {
      throw BadRequestException({
        message: "Can't unpublish an event that has bookings",
      });
    }
    throw BadRequestException({
      message: `Capacity can't be less than booked seats (${fresh.bookedSeats})`,
    });
  }

  return {
    ...updated.toObject(),
    availableSeats: updated.capacity - updated.bookedSeats,
  };
};

export const deleteEvent = async (id, user) => {
  const event = await EventModel.findById(id);
  if (!event) throw NotFoundException({ message: "Event not found" });

  const isOwner = event.organizer.equals(user._id);
  const isAdmin = user.role === UserRoleEnum.Admin;
  if (!isOwner && !isAdmin) {
    throw ForbiddenException({
      message: "You can only delete your own events",
    });
  }

  await EventModel.updateOne(
    { _id: id },
    { status: EventStatusEnum.Cancelled },
  );

  const hasBookings = await BookingModel.exists({ event: id });

  if (!hasBookings) {
    await EventModel.deleteOne({ _id: id });
    return { deleted: true };
  }

  const result = await BookingModel.updateMany(
    { event: id, status: BookingStatusEnum.Confirmed },
    { status: BookingStatusEnum.Cancelled, cancelledAt: new Date() },
  );
  await EventModel.updateOne({ _id: id }, { bookedSeats: 0 });

  return { deleted: false, cancelledBookings: result.modifiedCount };
};
export const getEventBookings = async (id, query, user) => {
  const event = await EventModel.findById(id);
  if (!event) throw NotFoundException({ message: "Event not found" });

  const isOwner = event.organizer.equals(user._id);
  const isAdmin = user.role === UserRoleEnum.Admin;
  if (!isOwner && !isAdmin) {
    throw ForbiddenException({
      message: "You can only see bookings of your own events",
    });
  }

  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;

  const bookings = await BookingModel.find({ event: id })
    .populate("user", "name email")
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);
  const total = await BookingModel.countDocuments({ event: id });

  return { bookings, total, page, limit };
};
