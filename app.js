var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var cors = require("cors");
var mongoose = require("mongoose");
let dbconnection = null;

var app = express();

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.use(cors());

const connectDB = () =>
    new Promise((resolve, reject) => {
        if (dbconnection) resolve(dbconnection);
        mongoose
            .connect(process.env.SRV, {
                useNewUrlParser: true,
                useUnifiedTopology: true,
            })
            .then((dbref) => {
                dbconnection = dbref;
                resolve(dbconnection);
            })
            .catch((err) => {
                console.error(err);
                reject(err);
            });
    });

app.use((req, res, next) => {
    connectDB()
        .then((db) => {
            req.db = db;
            next();
        })
        .catch((err) => {
            res.sendStatus(500);
        });
});

app.use("/api", require("./routes"));

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get("env") === "development" ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render("error");
});

module.exports = app;
