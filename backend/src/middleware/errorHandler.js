export function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || err.status || 500;
  console.error(err.message, err.stack);
  res.status(statusCode).json({
    success: false,
    error: {
      message: err.message || "Internal Server Error",
    },
  });
}

export function createError(statusCode, message) {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
}
