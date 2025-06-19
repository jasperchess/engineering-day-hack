export {
  fileActivityLogger,
  FileActivityLogger,
  type FileActivity,
  type FileActivityLog,
  type FileActivityMetrics,
  type LogLevel,
} from "./fileActivityLogger";

export {
  useFileActivityLogger,
  withFileActivityLogger,
  type WithFileActivityLoggerProps,
} from "./useFileActivityLogger";

// Additional logging utilities can be exported here
export * from "./fileActivityLogger";
export * from "./useFileActivityLogger";
