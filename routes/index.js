var indexRoutes = require("express").Router();

indexRoutes.use("/v1", require("./v1"));

module.exports = indexRoutes;
