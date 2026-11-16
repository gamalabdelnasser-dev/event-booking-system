import { Router } from "express";
import {
  authentication,
  authorization,
  optionalAuthentication,
  validation,
} from "../../middlewares/index.js";
import { successResponse, UserRoleEnum } from "../../common/index.js";
import {
  createEventSchema,
  eventBookingsSchema,
  eventIdSchema,
  listEventsSchema,
  updateEventSchema,
} from "./events.validation.js";
import {
  createEvent,
  deleteEvent,
  getEvent,
  getEventBookings,
  listEvents,
  updateEvent,
} from "./events.service.js";

const router = Router();

const manager = [
  authentication(),
  authorization(UserRoleEnum.Organizer, UserRoleEnum.Admin),
];

router.get(
  "/",
  optionalAuthentication(),
  validation(listEventsSchema),
  async (req, res) => {
    const data = await listEvents(req.query, req.user);
    return successResponse({ res, data });
  },
);

router.get(
  "/:id",
  optionalAuthentication(),
  validation(eventIdSchema),
  async (req, res) => {
    const event = await getEvent(req.params.id, req.user);
    return successResponse({ res, data: { event } });
  },
);

router.post(
  "/",
  ...manager,
  validation(createEventSchema),
  async (req, res) => {
    const event = await createEvent(req.body, req.user);

    return successResponse({
      res,
      status: 201,
      message: "Event created",
      data: { event },
    });
  },
);

router.patch(
  "/:id",
  ...manager,
  validation(updateEventSchema),
  async (req, res) => {
    const event = await updateEvent(req.params.id, req.body, req.user);
    return successResponse({ res, message: "Event updated", data: { event } });
  },
);

router.delete(
  "/:id",
  ...manager,
  validation(eventIdSchema),
  async (req, res) => {
    const result = await deleteEvent(req.params.id, req.user);

    return successResponse({
      res,
      message: result.cancelled
        ? "Event cancelled and its bookings were cancelled"
        : "Event deleted",
      data: result,
    });
  },
);

router.get(
  "/:id/bookings",
  ...manager,
  validation(eventBookingsSchema),
  async (req, res) => {
    const data = await getEventBookings(req.params.id, req.query, req.user);
    return successResponse({ res, data });
  },
);

export default router;
