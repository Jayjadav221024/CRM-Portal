/**
 * Standardized API response shapes
 */

const success = (res, data, meta = {}, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    data,
    meta,
    timestamp: new Date().toISOString(),
  });
};

const paginated = (res, data, pagination, extras = {}) => {
  return res.status(200).json({
    success: true,
    data,
    pagination,
    ...extras,
    timestamp: new Date().toISOString(),
  });
};

const error = (res, message, statusCode = 500, details = null) => {
  const body = {
    success: false,
    error: message,
    timestamp: new Date().toISOString(),
  };
  if (details && process.env.NODE_ENV === 'development') {
    body.details = details;
  }
  return res.status(statusCode).json(body);
};

module.exports = { success, paginated, error };