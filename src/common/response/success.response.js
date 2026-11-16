export const successResponse = ({
  message = "Done",
  res,
  status = 200,
  data = undefined,
}) => {
  return res.status(status).json({ status, message, data });
};
