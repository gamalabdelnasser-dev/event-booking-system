export const findOne = async ({
  model,
  filters = {},
  select = "",
  populate = undefined,
  options = { validateBeforeSave: true },
} = {}) => {
  return await model.findOne(filters).select(select);
};

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
export const findByIdAndUpdate = async ({
  id,
  update,
  options = { new: true },
  model,
}) => {
  return await model.findByIdAndUpdate(
    id,
    { ...update, $inc: { __v: 1 } },
    options,
  );
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
