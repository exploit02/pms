var mongoose = require("mongoose");
var util = require("../utils/util");

var UpcomingTarrifSchema = new mongoose.Schema(
    {
        product: {
            type: String,
            required: ["Product name is required"],
        },
        vendor: {
            type: String,
            required: ["Vendor name is required"],
        },
        startDate: {
            type: Date,
            required: ["Start Date name is required"],
            default: Date.now,
            set: util.getDate,
            get: util.setDate,
        },
        endDate: {
            type: Date,
            required: ["End Date name is required"],
            default: Date.now,
            set: util.getDate,
            get: util.setDate,
        },
        unitPrice: {
            type: Number,
            required: ["Unit Price name is required"],
        },
    },
    { timestamps: true }
);

UpcomingTarrifSchema.index({ product: 1, vendor: 1, startDate: 1 }, { unique: true });

const UpcomingTarrif = mongoose.model("UpcomingTarrif", UpcomingTarrifSchema);
module.exports = UpcomingTarrif;
