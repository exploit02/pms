const Tarrif = require("../../../model/tarrifModel");
module.exports = (req, res) => {
    let query = {};
    if (req.query.vendor) {
        query = { vendor: req.query.vendor };
    }
    Tarrif.find(query, { createdAt: 0, updatedAt: 0 })
        .then((data) => {
            res.status(200).json({
                success: true,
                message: `All tarrif plans${
                    req.query.vendor ? ` of vendor ${req.query.vendor}` : ""
                } retrived successfully`,
                result: data,
            });
        })
        .catch((err) => {
            res.status(500).json({
                success: false,
                message: "Something went wrong...!",
                result: {},
            });
        });
};
