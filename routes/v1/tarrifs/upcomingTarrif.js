const UpcomingTarrif = require("../../../model/upcomingTarrifModel");
module.exports = (req, res) => {
    let query = {};
    if (req.query.vendor) {
        query = { vendor: req.query.vendor };
    }

    UpcomingTarrif.find(query, { createdAt: 0, updatedAt: 0 })
        .then((data) => {
            res.status(200).send({
                success: true,
                message: `All upcoming tarrif plans${
                    req.query.vendor ? ` of vendor ${req.query.vendor}` : ""
                } retrived successfully`,
                result: data,
            });
        })
        .catch((err) => {
            res.status(500).send({
                success: false,
                message: "Internal Server Error...!",
                result: {},
            });
        });
};
