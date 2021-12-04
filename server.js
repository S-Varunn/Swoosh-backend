require("dotenv").config();
var express = require("express");
const mongoose = require("mongoose");
var app = express();
var multer = require("multer");
const crypto = require("crypto");
const { GridFsStorage } = require("multer-gridfs-storage");
var Grid = require("gridfs-stream");
const bodyParser = require("body-parser");
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
const path = require("path");
var assert = require("assert");
var cors = require("cors");
var mongodb = require("mongodb");
var fs = require("fs");

const File = require("./schema");
let filename;

const PORT = process.env.PORT || 8000;
const URI = process.env.MONGO_CONNECTION_URL;

const conn = mongoose.createConnection(process.env.MONGO_CONNECTION_URL);

let gfs;
conn.once("open", () => {
  //Init stream
  gfs = Grid(conn.db, mongoose.mongo);
  gfs.collection("fs");
});

app.use(cors());

//create storage engine
const storage = new GridFsStorage({
  url: process.env.MONGO_CONNECTION_URL,
  file: (req, file) => {
    return new Promise((resolve, reject) => {
      crypto.randomBytes(16, (err, buf) => {
        if (err) {
          return reject(err);
        }
        filename = buf.toString("hex") + path.extname(file.originalname);
        const fileInfo = {
          filename: filename,
          bucketName: "fs",
        };

        resolve(fileInfo);
      });
    });
  },
});
const upload = multer({ storage }).single("file");
//end

//post

const fileSizeFormatter = (bytes, decimal) => {
  if (bytes === 0) {
    return "0 Bytes";
  }
  const dm = decimal || 2;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "YB", "ZB"];
  const index = Math.floor(Math.log(bytes) / Math.log(1000));
  return (
    parseFloat((bytes / Math.pow(1000, index)).toFixed(dm)) + " " + sizes[index]
  );
};

const getFileExtension = (completeFilename) => {
  var extension = completeFilename.substring(
    completeFilename.lastIndexOf(".") + 1
  );
  return extension;
};

const today = new Date();
const tomorrow = new Date(today);
tomorrow.setDate(tomorrow.getDate() + 1);
let sender;
let validTill;

app.post("/userData", function (req, res) {
  sender = req.body.senderName;
  validTill = req.body.validTill;
});

app.post("/", upload, (req, res) => {
  const { file } = req;
  const { id } = file;
  const fileInfo = new File({
    originalFilename: req.file.originalname,
    fileSize: fileSizeFormatter(req.file.size, 2),
    fileType: req.file.mimetype,
    UploadedDate: req.file.uploadDate,
    ValidTillDate: validTill,
    fileId: id,
    encryptedFileName: req.file.filename,
    senderName: sender,
    iconFileFormat: getFileExtension(req.file.filename),
  });
  fileInfo.save(function (err, result) {
    if (err) {
      console.log(err);
    } else {
      //  console.log(result);
    }
  });
  res.json({ file: req.file });
});

app.get("/getLink", function (req, res) {
  res.json({
    success: true,
    download: `http://localhost:3000/download?filename=${filename}`,
  });
});

app.get("/downloaded/:filename", (req, res) => {
  mongoose.connect(URI, function (error, db) {
    assert.ifError(error);

    var gridfsbucket = new mongodb.GridFSBucket(db, {
      chunkSizeBytes: 1024,
      bucketName: "fs",
    });

    res.setHeader("Content-Type", "blob");
    gridfsbucket.openDownloadStreamByName(req.params.filename).pipe(res);
  });
});

app.get("/getFile/:filename", async (req, res) => {
  // Extract link and get file from storage send download stream
  const file = await File.findOne({ filename: req.params.filename });
  // Link expired
  if (!file) {
    return res.render("download", { error: "Link has been expired." });
  }

  const response = await file.save();
  const filePath = `${__dirname}/../Swoosh-backend/downloadedFiles/${req.params.filename}`;
  /* res.download(filePath); */
  res.send(filePath);
});
/* let fetchFileData; */

const handleDownload = () => {
  Axios.get(`${initObject.url}/download`, { responseType: "blob" }).then(
    (response) => {
      FileSaver.saveAs(response.data, "mydata");
      console.log(response);
    }
  );
};

app.use("/showDetails", require("./routes/showDetails"));
app.use("/downloadFile", require("./routes/downloadFile"));

app.listen(PORT, function () {
  console.log("App running on port " + PORT);
});
