var v1Routes = require("express").Router();

v1Routes.use("/tarrif", require("./tarrifs"));

module.exports = v1Routes;
