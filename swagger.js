const swaggerAutogen = require("swagger-autogen")();

const doc = {
  info: {
    title: "MAFIA",
    description: "A site where your wellbeing matters to us. You are our priority",
  },
  host: "startuphealth.onrender.com/",
  schemes: ["https"],
};
const outputFile = "./swagger-output.json";
const routes = ["./app.js"];

swaggerAutogen(outputFile, routes, doc);