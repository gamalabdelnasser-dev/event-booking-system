import joi from "joi";
import {
  EventStatusEnum,
  generalValidationFields as f,
} from "../../common/index.js";
const idParams = joi.object({ id: f.id.required() }).required();

export const eventIdSchema = { params: idParams };

export const createEventSchema = {
  body: joi
    .object({
      title: f.title.required(),
      description: f.description.required(),
      category: f.category.required(),
      isOnline: f.isOnline.default(false),
      location: f.location.when("isOnline", {
        is: true,
        then: joi.optional(),
        otherwise: joi.required(),
      }),
      startAt: f.startAt.required(),
      capacity: f.capacity.required(),
      price: f.price.required(),
      status: joi
        .string()
        .valid(EventStatusEnum.Draft, EventStatusEnum.Published)
        .default(EventStatusEnum.Draft),
    })
    .required(),
};

export const updateEventSchema = {
  params: idParams,
  body: joi
    .object({
      title: f.title,
      description: f.description,
      category: f.category,
      isOnline: f.isOnline,
      location: f.location,
      startAt: f.startAt,
      capacity: f.capacity,
      price: f.price,

      status: joi
        .string()
        .valid(EventStatusEnum.Draft, EventStatusEnum.Published),
    })
    .min(1)
    .required(),
};

export const listEventsSchema = {
  query: joi.object({
    page: f.page,
    limit: f.limit,
    search: joi.string().trim().max(100),
    category: f.category,
    from: f.date,
    to: f.date.min(joi.ref("from")),
    sortBy: joi.string().valid("startAt", "price").default("startAt"),
    order: joi.string().valid("asc", "desc").default("asc"),
  }),
};

export const eventBookingsSchema = {
  params: idParams,
  query: joi.object({ page: f.page, limit: f.limit }),
};
