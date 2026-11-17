import { Router } from "express";
import {
  authentication,
  authorization,
  optionalAuthentication,
  validation,
} from "../../middlewares/index.js";
import { successResponse, UserRoleEnum } from "../../Common/index.js";
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
      message: "Event created successfully",
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
    return successResponse({
      res,
      message: "Event updated successfully",
      data: { event },
    });
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
      message: result.deleted
        ? "Event deleted successfully"
        : "Event has bookings, so it was cancelled and its bookings were cancelled",
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
