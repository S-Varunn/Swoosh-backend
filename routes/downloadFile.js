require("dotenv").config();
var Grid = require("gridfs-stream");
const mongoose = require("mongoose");
var express = require("express");
var mongodb = require("mongodb");
var app = express();
var assert = require("assert");
var fs = require("fs");
const router = require("express").Router();
Grid.mongo = mongoose.mongo;
const conn = mongoose.createConnection(process.env.MONGO_CONNECTION_URL);
const URI = process.env.MONGO_CONNECTION_URL;

router.get("/:filename", (req, res) => {
  mongoose.connect(URI, function (error, db) {
    assert.ifError(error);

    var gridfsbucket = new mongodb.GridFSBucket(db, {
      chunkSizeBytes: 1024,
      bucketName: "fs",
    });
    gridfsbucket
      .openDownloadStreamByName(req.params.filename)
      .pipe(fs.createWriteStream(`../downloadedFiles/myfile`))
      .on("error", () => {
        console.log("Some error occurred in download:" + error);
        res.send(error);
      })
      .on("finish", () => {
        console.log("done downloading");
        res.send("Done Downloading");
      });
  });
});

module.exports = router;
