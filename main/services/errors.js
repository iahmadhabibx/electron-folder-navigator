class AppError extends Error {
  constructor(code, message, details = undefined) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.details = details;
  }
}

const ErrorCode = Object.freeze({
  DIRECTORY_NOT_FOUND: "DIRECTORY_NOT_FOUND",
  FILE_NOT_FOUND: "FILE_NOT_FOUND",
  FILE_ACCESS_DENIED: "FILE_ACCESS_DENIED",
  UNSUPPORTED_FILE_TYPE: "UNSUPPORTED_FILE_TYPE",
  INVALID_ARGUMENT: "INVALID_ARGUMENT",
  UNEXPECTED: "UNEXPECTED"
});

module.exports = { AppError, ErrorCode };
