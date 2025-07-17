const swaggerAutogen = require("swagger-autogen")();

const doc = {
  info: {
    title: "MAFIA",
    description: "A site where your wellbeing matters to us. You are our priority",
  },
  host: "startuphealth.onrender.com",
  basePath: "",
  schemes: ["https"],
  consumes: ['application/json', 'multipart/form-data'], // Make sure this is included
  produces: ['application/json'],
};
const outputFile = "./swagger-output.json";
const routes = ["./app.js"];

swaggerAutogen(outputFile, routes, doc);