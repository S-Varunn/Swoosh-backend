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

router.get("/myInfo/:filename", async (req, res) => {
  try {
    const file = await File.findOne({
      encryptedFileName: req.params.filename,
    });
    let currentdate = new Date().toLocaleString();
    let objDate = new Date(file.ValidTillDate).toLocaleString();
    if (objDate < currentdate) {
      return res.status(410).json({ message: "Your link has expired" });
    }
    if (file == null) {
      return res.status(404).json({ message: "Unable to access file details" });
    }
    return res.json(file);
  } catch (err) {
    return res.json({ err: "Some error" });
  }
});

/* router.get("/delete/:filename", async (req, res) => {
  try {
    await gfs2.files.deleteOne({
      filename: req.params.filename,
    });
    return res.json({ msg: "file deleted" });
  } catch (err) {
    return res.json({ msg: "some error" });
  }
}); */

module.exports = router;
