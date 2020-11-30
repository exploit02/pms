var moment = require("moment-timezone");
var fs = require("fs");
var path = require("path");
var multiparty = require("multiparty");
var csv = require("csv-parse");
var { Transform } = require("stream");
var UpcomingTarrif = require("../../../model/upcomingTarrifModel");
var Tarrif = require("../../../model/tarrifModel");
const XLSXWriteStream = require("xlsx-write-stream");

const csvStream = csv({
    columns: true,
    delimiter: ",",
    trim: true,
});
module.exports = (req, res) => {
    req.xlsxWriter = new XLSXWriteStream();
    var form = new multiparty.Form();
    form.parse(req, (err, fields, files) => {
        if (files === undefined || !Object.keys(files).includes("tarrifs")) {
            /*
             * If user is not sending any file or key is not csv
             */
            res.status(400).send({
                success: false,
                message: "Make sure you are sending one file with key: tarrifs",
                result: {},
            });

            return;
        }

        var filepath = files.tarrifs[0].path;

        if (path.extname(filepath) !== ".csv") {
            /*
             * If user is sending any other type file instead of CSV
             */
            res.status(422).send({ success: false, message: "Invalid File Type", result: {} });
            return;
        }

        var readStream = fs.createReadStream(filepath);
        // var stream = ;
        req.xlsxWriter.setInputStream(readStream.pipe(csvStream).pipe(batchProcessing()));

        const xlsxStream = req.xlsxWriter.getOutputStream();
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Disposition", "attachment; filename=test.xlsx");
        xlsxStream.pipe(res);
    });
};

function batchProcessing() {
    const jsonToDb = new Transform({
        writableObjectMode: true,
        readableObjectMode: true,
        transform(chunk, encoding, callback) {
            // to check current memory usage
            //const used = process.memoryUsage().heapUsed / 1024 / 1024;

            let sanitized = dataSanitizer(chunk);
            if (sanitized.currentTarrif && sanitized.chunk) {
                this.records.currentTarrif.push(sanitized.chunk);
            } else if (sanitized.futureTarrif && sanitized.chunk) {
                this.records.futureTarrif.push(sanitized.chunk);
            } else {
                this.push([...Object.values(chunk), "Invalid data"]);
            }

            // batch processing of records
            if (
                this.records.currentTarrif.length + this.records.futureTarrif.length == process.env.BATCH_SIZE ||
                1000
            ) {
                bulkUpsert(this.records)
                    .then((data) => {
                        this.records.currentTarrif = [];
                        this.records.futureTarrif = [];
                        callback();
                    })
                    .catch((err) => {
                        this.records.currentTarrif = [];
                        this.records.futureTarrif = [];
                        callback();
                    });
            } else {
                callback();
            }
        },
        flush(done) {
            // flush we repeat steps for last records,
            // eg total records 108, last 8 records are left to process
            if (this.records.currentTarrif.length + this.records.futureTarrif.length > 0) {
                bulkUpsert(this.records)
                    .then((data) => {
                        this.records.currentTarrif = [];
                        this.records.futureTarrif = [];
                        done();
                    })
                    .catch((err) => {
                        this.records.currentTarrif = [];
                        this.records.futureTarrif = [];
                        done();
                    });
            } else {
                done();
            }
        },
    });
    jsonToDb.records = {
        currentTarrif: [],
        futureTarrif: [],
    };
    return jsonToDb;
}

function dataSanitizer(chunk) {
    if (
        !chunk.product ||
        !chunk.vendor ||
        !moment(chunk.startDate, "DD/MM/YYYY").isValid() ||
        !moment(chunk.endDate, "DD/MM/YYYY").isValid() ||
        moment().isAfter(moment(chunk.startDate, "DD/MM/YYYY"), "d") ||
        moment().isAfter(moment(chunk.endDate, "DD/MM/YYYY"), "d") ||
        isNaN(chunk.unitPrice)
    ) {
        return false;
    }

    let sanitized = {
        ...chunk,
        startDate: moment(chunk.startDate, "DD/MM/YYYY").tz("Asia/Kolkata").startOf("day").toDate(),
        endDate: moment(chunk.endDate, "DD/MM/YYYY").tz("Asia/Kolkata").endOf("day").toDate(),
    };

    if (moment().isSame(moment(sanitized.startDate), "d")) {
        return {
            currentTarrif: true,
            chunk: {
                updateOne: {
                    filter: { product: chunk.product, vendor: chunk.vendor },
                    update: sanitized,
                    upsert: true,
                },
            },
        };
    } else if (moment().isBefore(moment(sanitized.startDate), "d")) {
        return {
            futureTarrif: true,
            chunk: {
                updateOne: {
                    filter: { product: chunk.product, vendor: chunk.vendor },
                    update: sanitized,
                    upsert: true,
                },
            },
        };
    }
}

function bulkUpsert(dataToStore) {
    return new Promise((resolve, reject) => {
        Promise.all([
            Tarrif.bulkWrite(dataToStore.currentTarrif).catch((err) => err),
            UpcomingTarrif.bulkWrite(dataToStore.futureTarrif).catch((err) => err),
        ])
            .then((data) => {
                resolve(data);
            })
            .catch((e) => {
                reject(e);
            });
    });
}
