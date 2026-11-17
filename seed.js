// Usage: npm run seed
// WARNING: this script DELETES all users, events and bookings, then recreates demo data.
// Adjust the import paths below to match your folder structure / casing.
import mongoose from "mongoose";
import { DB_URI_LOCAL } from "./config/config.service.js";
import {
  BookingStatusEnum,
  EventStatusEnum,
  generateHash,
  UserRoleEnum,
} from "./Common/index.js";
import { BookingModel, EventModel, UserModel } from "./DB/index.js";

const PASSWORD = process.env.SEED_PASSWORD ?? "Password@123";
const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const inFuture = (ms) => new Date(Date.now() + ms);

const seed = async () => {
  await mongoose.connect(DB_URI_LOCAL);
  console.log("Connected to DB");

  await Promise.all([
    BookingModel.deleteMany({}),
    EventModel.deleteMany({}),
    UserModel.deleteMany({}),
  ]);

  // ---------- Users ----------
  const password = await generateHash({ plainText: PASSWORD });
  const [admin, org1, org2, att1, att2, att3] = await UserModel.create([
    {
      name: "Admin",
      email: "admin@example.com",
      password,
      role: UserRoleEnum.Admin,
    },
    {
      name: "Organizer One",
      email: "organizer1@example.com",
      password,
      role: UserRoleEnum.Organizer,
    },
    {
      name: "Organizer Two",
      email: "organizer2@example.com",
      password,
      role: UserRoleEnum.Organizer,
    },
    {
      name: "Attendee One",
      email: "attendee1@example.com",
      password,
      role: UserRoleEnum.User,
    },
    {
      name: "Attendee Two",
      email: "attendee2@example.com",
      password,
      role: UserRoleEnum.User,
    },
    {
      name: "Attendee Three",
      email: "attendee3@example.com",
      password,
      role: UserRoleEnum.User,
    },
  ]);

  // ---------- Events ----------
  const [
    nodeWorkshop,
    reactConf,
    fullEvent,
    draftEvent,
    pastEvent,
    cancelledEvent,
  ] = await EventModel.create([
    {
      title: "Node.js Workshop",
      description: "Hands-on workshop about building REST APIs with Express.",
      category: "workshop",
      location: "Cairo, Tech Hub",
      startAt: inFuture(7 * DAY),
      capacity: 30,
      price: 200,
      status: EventStatusEnum.Published,
      organizer: org1._id,
    },
    {
      title: "React Conference",
      description: "One day conference with talks about modern React.",
      category: "conference",
      isOnline: true,
      startAt: inFuture(14 * DAY),
      capacity: 100,
      price: 500,
      status: EventStatusEnum.Published,
      organizer: org1._id,
    },
    {
      title: "Sold Out Course",
      description: "Small course, already full (useful to test overbooking).",
      category: "course",
      location: "Alexandria",
      startAt: inFuture(10 * DAY),
      capacity: 5,
      price: 100,
      status: EventStatusEnum.Published,
      organizer: org2._id,
    },
    {
      title: "Draft Event",
      description:
        "Not published yet, only visible to its organizer and admin.",
      category: "workshop",
      location: "Giza",
      startAt: inFuture(20 * DAY),
      capacity: 20,
      price: 0,
      status: EventStatusEnum.Draft,
      organizer: org2._id,
    },
    {
      title: "Past Event",
      description: "Already started, can't be booked.",
      category: "conference",
      location: "Cairo",
      startAt: new Date(Date.now() - 3 * DAY),
      capacity: 50,
      price: 150,
      status: EventStatusEnum.Published,
      organizer: org2._id,
    },
    {
      title: "Cancelled Event",
      description: "Cancelled by the organizer, can't be booked.",
      category: "course",
      location: "Mansoura",
      startAt: inFuture(5 * DAY),
      capacity: 25,
      price: 80,
      status: EventStatusEnum.Cancelled,
      organizer: org1._id,
    },
  ]);

  // ---------- Bookings ----------
  const bookingsData = [
    { user: att1, event: nodeWorkshop, seats: 2 },
    { user: att2, event: nodeWorkshop, seats: 1 },
    { user: att1, event: reactConf, seats: 3 },
    { user: att3, event: fullEvent, seats: 5 }, // fills the event
  ];

  for (const { user, event, seats } of bookingsData) {
    await BookingModel.create({
      user: user._id,
      event: event._id,
      seats,
      totalPrice: seats * event.price,
      status: BookingStatusEnum.Confirmed,
    });
    await EventModel.updateOne(
      { _id: event._id },
      { $inc: { bookedSeats: seats } },
    );
  }

  // a cancelled booking (doesn't count in bookedSeats)
  await BookingModel.create({
    user: att2._id,
    event: reactConf._id,
    seats: 2,
    totalPrice: 2 * reactConf.price,
    status: BookingStatusEnum.Cancelled,
    cancelledAt: new Date(),
  });

  console.log("Seed done.\n");
  console.log(`All accounts use the password: ${PASSWORD}`);
  console.table([
    { role: "admin", email: admin.email },
    { role: "organizer", email: org1.email },
    { role: "organizer", email: org2.email },
    { role: "attendee", email: att1.email },
    { role: "attendee", email: att2.email },
    { role: "attendee", email: att3.email },
  ]);

  await mongoose.disconnect();
};

seed().catch(async (error) => {
  console.error("Seed failed:", error);
  await mongoose.disconnect();
  process.exit(1);
});
