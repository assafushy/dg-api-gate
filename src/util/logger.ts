import * as winston from "winston";

let logsPath = process.env.logs_path || "./logs/";
const logFormat = winston.format.printf(
  (info) => `${info.timestamp} - ${info.level}: ${info.message}`
);

const logger: winston.Logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.colorize(),
    winston.format.prettyPrint(),
    winston.format.errors({ stack: true })
  ),
  level: "silly",
  transports: [
    new winston.transports.File({
      filename: `${logsPath}minio-client.log`,
      level: "error",
      format: logFormat,
    }),
    new winston.transports.File({
      filename: `${logsPath}minio-client-all.log`,
      format: logFormat,
    }),
    new winston.transports.Console({ format: logFormat, level: "debug" }),
  ],
});

export default logger;
