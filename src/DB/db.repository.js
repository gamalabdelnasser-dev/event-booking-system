export const findOne = async ({
  model,
  filters = {},
  select = "",
  populate,
  options = {},
} = {}) => {
  let query = model.findOne(filters).select(select);
  if (populate) query = query.populate(populate);
  if (options.lean) query = query.lean();
  return await query;
};
export const find = async ({
  model,
  filters = {},
  select = "",
  populate,
  sort,
  skip = 0,
  limit = 10,
  lean = true,
} = {}) => {
  let query = model
    .find(filters)
    .select(select)
    .sort(sort)
    .skip(skip)
    .limit(limit);
  if (populate) query = query.populate(populate);
  if (lean) query = query.lean();
  return await query;
};

export const countDocuments = async ({ model, filters = {} } = {}) =>
  await model.countDocuments(filters);

export const findOneById = async ({
  model,
  id = {},
  select = "",
  populate = undefined,
} = {}) => {
  return await model.findById(id).select(select);
};

export const createOne = async ({
  model,
  data = {},
  options = { validateBeforeSave: true },
} = {}) => {
  const [result] = await model.create([data], options);
  return result;
};

export const create = async ({
  model,
  data = [{}],
  options = { validateBeforeSave: true },
} = {}) => {
  return await model.create(data, options);
};
export const deleteOne = async ({ filter, model }) => {
  return await model.deleteOne(filter || {});
};

export const findOneAndDelete = async ({ filter, model } = {}) => {
  return await model.findOneAndDelete(filter || {});
};
export const findOneAndUpdate = async ({
  model,
  filters,
  update,
  options = {},
}) => {
  return await model.findOneAndUpdate(filters, update, {
    new: true,
    ...options,
  });
};

export const updateOne = async ({ filter, update, options, model } = {}) => {
  if (Array.isArray(update)) {
    update.push({
      $set: {
        __v: { $add: ["$__v", 1] },
      },
    });
    return await model.updateOne(filter || {}, update, {
      ...options,
      runValidators: true,
      updatePipeline: true,
    });
  }

  return await model.updateOne(
    filter || {},
    { ...update, $inc: { __v: 1 } },
    options,
  );
};
