export const ErrorException = ({
  message = "Fail",
  cause = { statusCode: 500 },
}) => {
  return new Error(message, { cause });
};

export const NotFoundException = ({ message = "Not Found", extra = {} }) => {
  return ErrorException({ message, cause: { statusCode: 404, extra } });
};
export const BadRequestException = ({
  message = "Bad Request",
  extra = {},
}) => {
  return ErrorException({ message, cause: { statusCode: 400, extra } });
};

export const ForbiddenException = ({
  message = "Forbidden Resource",
  extra = {},
}) => {
  return ErrorException({ message, cause: { statusCode: 403, extra } });
};
export const ConflictException = ({ message = "Conflict ", extra = {} }) => {
  return ErrorException({ message, cause: { statusCode: 409, extra } });
};

export const UnauthorizedException = ({
  message = "Unauthorized ",
  extra = {},
}) => {
  return ErrorException({ message, cause: { statusCode: 401, extra } });
};
