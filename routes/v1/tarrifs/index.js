const tarrifRouter = require("express").Router();

tarrifRouter.post("/upload", require("./uploadTarrif"));
tarrifRouter.get("/current", require("./currentTarrif"));
tarrifRouter.get("/upcoming", require("./upcomingTarrif"));

module.exports = tarrifRouter;
