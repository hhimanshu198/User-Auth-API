const { createLogger, format, transports } = require("winston");
const path = require("path");

const logger = createLogger({

    level: "info",

    format: format.combine(

        format.timestamp({
            format: "YYYY-MM-DD HH:mm:ss"
        }),

        format.errors({ stack: true }),

        format.printf(({ level, message, timestamp, stack, method, url, ip }) => {

            return `
[${timestamp}] ${level.toUpperCase()}
Message: ${message}
Method: ${method || "N/A"}
URL: ${url || "N/A"}
IP: ${ip || "N/A"}
Stack: ${stack || "N/A"}
`;
        })
    ),

    transports: [

        new transports.File({
            filename: path.join(__dirname, "../logs/error.log"),
            level: "error"
        }),

        new transports.File({
            filename: path.join(__dirname, "../logs/combined.log")
        }),

        new transports.Console({

          format: format.combine(

            format.colorize(),

            format.printf(({ level, message, timestamp }) => {

              return `[${timestamp}] ${message}`;
            })
          )
        })
    ],

    exceptionHandlers: [

        new transports.File({
            filename: path.join(__dirname, "../logs/exceptions.log")
        })
    ],

    rejectionHandlers: [

        new transports.File({
            filename: path.join(__dirname, "../logs/rejections.log")
        })
    ]
});

module.exports = logger;
