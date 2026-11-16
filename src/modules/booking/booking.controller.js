import { Router } from "express";
import { authentication, validation } from "../../middlewares/index.js";
import { successResponse } from "../../Common/index.js";
import {
  createBookingSchema,
  cancelBookingSchema,
} from "./booking.validation.js";
import {
  createBooking,
  getMyBookings,
  cancelBooking,
} from "./booking.service.js";
const router = Router();

router.post(
  "/events/:id/bookings",
  authentication(),
  validation(createBookingSchema),
  async (req, res) => {
    const booking = await createBooking(
      req.params.id,
      req.user.sub,
      req.body.quantity,
    );
    return successResponse({
      res,
      status: 201,
      message: "Booking created successfully",
      data: { booking },
    });
  },
);

// Get My Bookings
router.get("/bookings/me", authentication(), async (req, res) => {
  const bookings = await getMyBookings(req.user.sub);

  return successResponse({
    res,
    status: 200,
    message: "Bookings retrieved successfully",
    data: { bookings },
  });
});

router.patch(
  "/bookings/:id/cancel",
  authentication(),
  validation(cancelBookingSchema),
  async (req, res) => {
    const booking = await cancelBooking(req.params.id, req.user.sub);

    return successResponse({
      res,
      status: 200,
      message: "Booking cancelled successfully",
      data: { booking },
    });
  },
);

export default router;
