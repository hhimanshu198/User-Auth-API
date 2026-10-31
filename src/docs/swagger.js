const swaggerJsDoc = require("swagger-jsdoc");

const options = {

  definition: {

    openapi: "3.0.0",

    info: {
      title: "Auth RBAC API",
      version: "1.0.0",
      description:
        "Authentication API with RBAC and Suspicious Login Detection"
    },

    servers: [
      {
        url: "http://localhost:5000"
      }
    ],

    components: {

      securitySchemes: {

        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT"
        }
      }
    },

    security: [
      {
        bearerAuth: []
      }
    ]
  },

  apis: ["./src/routes/*.js"]
};

const swaggerSpec = swaggerJsDoc(options);

module.exports = swaggerSpec;