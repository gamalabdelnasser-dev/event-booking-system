# Events Booking API

REST API for booking events (workshops, conferences, courses) built with **Node.js, Express and MongoDB (Mongoose)**.

Roles: **Attendee** (`user`), **Organizer** (`organizer`), **Admin** (`admin`).

## Requirements

- Node.js 20+
- MongoDB running locally (or a connection string)

## Setup

```bash
npm install
cp config/.env.example
npm run seed
npm run start:dev
```

The server runs on `http://localhost:3000` by default.

### Environment variables

Put them in `config/.env.development`:

| Variable                                                           | Description                                   |
| ------------------------------------------------------------------ | --------------------------------------------- |
| `SERVER_PORT`                                                      | Port (default 3000)                           |
| `NODE_ENV`                                                         | `development` or `production`                 |
| `DB_URI_LOCAL`                                                     | MongoDB connection string                     |
| `SALT_ROUND`                                                       | bcrypt salt rounds                            |
| `USER_ACCESS_TOKEN_SECRET_KEY` / `USER_REFRESH_TOKEN_SECRET_KEY`   | JWT secrets for attendee/organizer            |
| `ADMIN_ACCESS_TOKEN_SECRET_KEY` / `ADMIN_REFRESH_TOKEN_SECRET_KEY` | JWT secrets for admin                         |
| `ACCESS_TOKEN_EXPIRES_IN`                                          | Access token lifetime in seconds (e.g. `900`) |
| `REFRESH_TOKEN_EXPIRES_IN`                                         | Refresh token lifetime (e.g. `1y`)            |
| `ISSUER`                                                           | JWT issuer                                    |

Use long random strings for the secrets. Never commit the real `.env` file.

## Seed data

`npm run seed` clears the database and creates:

| Role      | Email                                                                     |
| --------- | ------------------------------------------------------------------------- |
| Admin     | `admin@example.com`                                                       |
| Organizer | `organizer1@example.com`, `organizer2@example.com`                        |
| Attendee  | `attendee1@example.com`, `attendee2@example.com`, `attendee3@example.com` |

Password for all accounts: `Password@123` (override with `SEED_PASSWORD`).

Events included: two upcoming published events, a sold-out event, a draft, a past event, and a cancelled event, plus a few confirmed bookings and one cancelled booking, so every rule below can be tested right away.

## Endpoints

Base path: `/api`

### Auth

| Method | Path             | Access                                    |
| ------ | ---------------- | ----------------------------------------- |
| POST   | `/auth/register` | Public (role: `user` or `organizer` only) |
| POST   | `/auth/login`    | Public                                    |
| GET    | `/auth/me`       | Any logged-in user                        |

### Events

| Method | Path                   | Access                                         |
| ------ | ---------------------- | ---------------------------------------------- |
| GET    | `/events`              | Public                                         |
| GET    | `/events/:id`          | Public (drafts/cancelled only for owner/admin) |
| POST   | `/events`              | Organizer, Admin                               |
| PATCH  | `/events/:id`          | Owner or Admin                                 |
| DELETE | `/events/:id`          | Owner or Admin                                 |
| GET    | `/events/:id/bookings` | Owner or Admin                                 |

`GET /events` query params: `page`, `limit`, `search` (title), `category`, `from`, `to`, `sortBy` (`startAt` or `price`), `order` (`asc` or `desc`). Response includes `total` and `availableSeats` for each event. Normal users and guests only see published events.

### Bookings

| Method | Path                   | Access                       |
| ------ | ---------------------- | ---------------------------- |
| POST   | `/events/:id/bookings` | Attendee                     |
| GET    | `/bookings/me`         | Attendee (own bookings only) |
| PATCH  | `/bookings/:id/cancel` | Booking owner                |

## Business rules and how they are enforced

- **No overbooking, even with concurrent requests:** the seat check and increment happen in a single atomic `findOneAndUpdate` (with `$expr: bookedSeats + seats <= capacity`). If two users book the last seat at the same time, only one succeeds.
- **1 to 5 seats per booking, one active booking per user per event:** Joi validation + Mongoose `min/max` + a partial unique index on `{ user, event }` for confirmed bookings.
- **Can't book** an event that is not published, cancelled, or already started (checked inside the same atomic query).
- **Cancellation** is allowed until 24 hours before the event; seats are returned. Double cancel is safe: only one request wins the status update, so seats are returned once.
- **Organizer can't reduce capacity** below booked seats, and can't unpublish an event that has bookings (checked atomically inside the update query).
- **Deleting an event:** no bookings means a real delete. With bookings the event is marked `cancelled` and all its bookings are cancelled.
- **Total price** is calculated at booking time (`seats * price`) and stored with the booking, so later price changes don't affect old bookings.
- **Ownership checks:** users only see/cancel their own bookings; only the event owner or an admin can edit, delete, or list bookings of an event.

## Decisions I made

- Admin accounts can't be created through the API; they are created only by the seed script.
- Booking endpoints (create, list mine) are for the `user` role only. Organizers and admins manage events, they don't book.
- Admins can edit/delete any event and see its bookings, but cancel-booking is limited to the booking's owner.
- Drafts and cancelled events return `404` to non-owners so their existence isn't revealed.
- Cancellation exactly 24 hours before the event is allowed.

## Known limitations

- Deleting/cancelling an event with bookings updates the event and its bookings in separate steps (no transaction, because that needs a MongoDB replica set). The event is closed for booking first, so the remaining race window is very small. With a replica set this should be wrapped in a transaction.
- No refresh-token rotation or revocation list.
- No automated tests yet.

## Project structure

```
config/        env loading and constants
src/
  Common/      enums, exceptions, response helper, hashing, token helpers, Joi fields
  DB/          models and reusable query helpers
  middlewares/ authentication, authorization, validation, error handler
  modules/     auth, events, bookings (routes + service + validation)
```
