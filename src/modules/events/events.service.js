import {
  BadRequestException,
  BookingStatusEnum,
  ConflictException,
  EventStatusEnum,
  ForbiddenException,
  NotFoundException,
  UserRoleEnum,
} from "../../common/index.js";

import {
  BookingModel,
  EventModel,
  countDocuments,
  createOne,
  deleteOne,
  find,
  findOneAndUpdate,
  findOneById,
} from "../../DB/index.js";

const isAdmin = (user) => user?.role === UserRoleEnum.Admin;

const canManage = (user, event) =>
  isAdmin(user) || event.organizer.equals(user._id);

const pagination = (query) => {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 10, 1), 100);

  return { page, limit, skip: (page - 1) * limit };
};

const present = (event) => {
  const data = event.toObject();
  delete data.__v;

  return {
    ...data,
    availableSeats: data.capacity - data.bookedSeats,
  };
};

export const createEvent = async (body, user) => {
  const event = await createOne({
    model: EventModel,
    data: { ...body, organizer: user._id },
  });

  return present(event);
};

export const listEvents = async (query, user) => {
  const { page, limit, skip } = pagination(query);

  const filters = {};

  if (!isAdmin(user)) {
    if (user?.role === UserRoleEnum.Organizer) {
      filters.$or = [
        { status: EventStatusEnum.Published },
        { organizer: user._id },
      ];
    } else {
      filters.status = EventStatusEnum.Published;
    }
  }

  if (query.search) {
    filters.title = {
      $regex: query.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      $options: "i",
    };
  }

  if (query.category) {
    filters.category = {
      $regex: `^${query.category}$`,
      $options: "i",
    };
  }

  if (query.from || query.to) {
    filters.startAt = {};

    if (query.from) filters.startAt.$gte = new Date(query.from);
    if (query.to) filters.startAt.$lte = new Date(query.to);
  }

  const sort = {
    [query.sortBy === "price" ? "price" : "startAt"]:
      query.order === "desc" ? -1 : 1,
  };

  const [events, total] = await Promise.all([
    find({
      model: EventModel,
      filters,
      sort,
      skip,
      limit,
      select: "-__v",
    }),
    countDocuments({ model: EventModel, filters }),
  ]);

  return {
    events: events.map(present),
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getEvent = async (id, user) => {
  const event = await findOneById({ model: EventModel, id });

  if (!event) {
    throw NotFoundException({ message: "Event not found" });
  }

  if (event.status !== EventStatusEnum.Published && !canManage(user, event)) {
    throw NotFoundException({ message: "Event not found" });
  }

  return present(event);
};

export const updateEvent = async (id, body, user) => {
  const event = await findOneById({ model: EventModel, id });

  if (!event) {
    throw NotFoundException({ message: "Event not found" });
  }

  if (!canManage(user, event)) {
    throw ForbiddenException({
      message: "You can only modify your own events",
    });
  }

  if (event.status === EventStatusEnum.Cancelled) {
    throw ConflictException({
      message: "Cancelled events cannot be modified",
    });
  }

  if (!body.isOnline && !(body.location ?? event.location)) {
    throw BadRequestException({
      message: "Location is required for non-online events",
    });
  }

  const filters = {
    _id: id,
    status: { $ne: EventStatusEnum.Cancelled },
  };

  if (body.capacity !== undefined) {
    if (body.capacity < event.bookedSeats) {
      throw BadRequestException({
        message: "Capacity cannot be less than booked seats",
      });
    }

    filters.bookedSeats = { $lte: body.capacity };
  }

  if (body.status === EventStatusEnum.Draft) {
    if (event.bookedSeats > 0) {
      throw BadRequestException({
        message: "Cannot unpublish an event that has bookings",
      });
    }

    filters.bookedSeats = 0;
  }

  const updated = await findOneAndUpdate({
    model: EventModel,
    filters,
    update: { $set: body },
  });

  if (!updated) {
    throw ConflictException({
      message: "Event was modified, please retry",
    });
  }

  return present(updated);
};

export const deleteEvent = async (id, user) => {
  const event = await findOneById({ model: EventModel, id });

  if (!event) {
    throw NotFoundException({ message: "Event not found" });
  }

  if (!canManage(user, event)) {
    throw ForbiddenException({
      message: "You can only delete your own events",
    });
  }

  const hasBookings = await BookingModel.exists({ event: id });

  if (!hasBookings) {
    await deleteOne({ model: EventModel, filter: { _id: id } });

    return { deleted: true, cancelled: false };
  }

  await findOneAndUpdate({
    model: EventModel,
    filters: { _id: id },
    update: {
      $set: {
        status: EventStatusEnum.Cancelled,
        bookedSeats: 0,
      },
    },
  });

  const result = await BookingModel.updateMany(
    {
      event: id,
      status: { $ne: BookingStatusEnum.Cancelled },
    },
    {
      $set: {
        status: BookingStatusEnum.Cancelled,
        cancelledAt: new Date(),
      },
    },
  );

  return {
    deleted: false,
    cancelled: true,
    cancelledBookings: result.modifiedCount,
  };
};

export const getEventBookings = async (id, query, user) => {
  const event = await findOneById({ model: EventModel, id });

  if (!event) {
    throw NotFoundException({ message: "Event not found" });
  }

  if (!canManage(user, event)) {
    throw ForbiddenException({
      message: "You can only view bookings of your own events",
    });
  }

  const { page, limit, skip } = pagination(query);
  const filters = { event: id };

  const [bookings, total] = await Promise.all([
    find({
      model: BookingModel,
      filters,
      populate: { path: "user", select: "name email" },
      sort: { createdAt: -1 },
      skip,
      limit,
      select: "-__v",
    }),
    countDocuments({ model: BookingModel, filters }),
  ]);

  return {
    bookings,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};
