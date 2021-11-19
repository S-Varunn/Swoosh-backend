require("dotenv").config();
var Grid = require("gridfs-stream");
const mongoose = require("mongoose");
const File = require("../schema");
var express = require("express");
var app = express();
const router = require("express").Router();

const conn = mongoose.createConnection(process.env.MONGO_CONNECTION_URL);

let gfs2;
let gfs;
conn.once("open", () => {
  //Init stream
  gfs2 = Grid(conn.db, mongoose.mongo);
  gfs2.collection("fs");

  gfs = new mongoose.mongo.GridFSBucket(conn.db, { bucketName: "fs" });
});

router.get("/:filename", (req, res) => {
  gfs2.files.findOne({ filename: req.params.filename }, (err, file) => {
    if (!file || file.length === 0) {
      return res.status(400).json({ err: "no file exists" });
    }
    fetchFileData = file._id;
    return res.json(file);
  });
});

//console.log(Connection);
router.get("/myInfo/:filename", async (req, res) => {
  try {
    const file = await File.findOne({
      encryptedFileName: req.params.filename,
    });

    return res.json(file);
  } catch (err) {
    return res.json({ err: "some error" });
  }
});
module.exports = router;
