// Error Handler Middleware
const errorHandler = (err, req, res, next) => {
  // Log error for debugging
  console.error(err.stack);

  // Set status code
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  res.status(statusCode).json({
    success: false,
    message: err.message,
    // Only show stack trace in development
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

export default errorHandler;
