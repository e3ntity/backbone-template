import winston from "winston";

const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp(),
    winston.format.printf((info) => {
      let output = `${info.timestamp} ${info.level}: ${info.message}`;

      if (info.stack) output += `\n${info.stack}`;

      return output;
    }),
    winston.format.errors({ stack: true })
  ),
  transports: [new winston.transports.Console()],
});

export default logger;
