var moment = require("moment-timezone");
const util = {
    getDate: (val) => {
        if (moment(val, "DD/MM/YYYY").isValid()) {
            return moment(val, "DD/MM/YYYY").tz("Asia/Kolkata").toDate();
        }
        return moment().tz("Asia/Kolkata").toDate();
    },
    setDate: (val) => {
        return moment(val).tz("Asia/Kolkata").format("DD/MM/YYYY");
    },
};

module.exports = util;
