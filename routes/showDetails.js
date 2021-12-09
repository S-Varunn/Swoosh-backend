require("dotenv").config();
var Grid = require("gridfs-stream");
const mongoose = require("mongoose");
const File = require("../schema");
var express = require("express");
var moment = require("moment");
var app = express();
const router = require("express").Router();

//Establishing connection with mongo using mongoose and grid fs bucket

const conn = mongoose.createConnection(process.env.MONGO_CONNECTION_URL);

let gfs2;
let gfs;
conn.once("open", () => {
  //Init streamS
  gfs2 = Grid(conn.db, mongoose.mongo);
  gfs2.collection("fs");

  gfs = new mongoose.mongo.GridFSBucket(conn.db, { bucketName: "fs" });
});

//api to fetch details of the file to be downloaded
router.get("/myInfo/:filename", async (req, res) => {
  try {
    const file = await File.findOne({
      encryptedFileName: req.params.filename,
    });
    let currentdate = moment();
    let objDate = moment(file.ValidTillDate);
    if (moment(objDate).diff(currentdate) < 0) {
      return res.status(410).json({ message: "Your link has expired" });
    }
    if (file == null) {
      return res.status(404).json({ message: "Unable to access file details" });
    }
    return res.json(file);
  } catch (err) {
    return res.json({ message: "Please wait for some time", code: 405 });
  }
});

module.exports = router;
