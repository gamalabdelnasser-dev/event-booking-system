import { Router } from "express";
import {
  authentication,
  authorization,
  validation,
} from "../../middlewares/index.js";
import { successResponse, UserRoleEnum } from "../../Common/index.js";
import {
  cancelBookingSchema,
  createBookingSchema,
} from "./booking.validation.js";
import {
  cancelBooking,
  createBooking,
  getMyBookings,
} from "./booking.service.js";

const router = Router();

const attendee = [authentication(), authorization(UserRoleEnum.User)];

// POST /api/events/:id/bookings
router.post(
  "/events/:id/bookings",
  ...attendee,
  validation(createBookingSchema),
  async (req, res) => {
    const booking = await createBooking(
      req.params.id,
      req.user,
      req.body.seats,
    );
    return successResponse({
      res,
      status: 201,
      message: "Booking created successfully",
      data: { booking },
    });
  },
);

// GET /api/bookings/me
router.get("/bookings/me", ...attendee, async (req, res) => {
  const bookings = await getMyBookings(req.user);
  return successResponse({ res, data: { bookings } });
});

// PATCH /api/bookings/:id/cancel
router.patch(
  "/bookings/:id/cancel",
  authentication(),
  validation(cancelBookingSchema),
  async (req, res) => {
    const booking = await cancelBooking(req.params.id, req.user);
    return successResponse({
      res,
      message: "Booking cancelled successfully",
      data: { booking },
    });
  },
);
export default router;
