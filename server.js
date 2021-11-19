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
        const originalname = file.originalname;
        filename = buf.toString("hex") + path.extname(file.originalname);
        const fileInfo = {
          filename: filename,
          bucketName: "fs",
        };
        console.log(originalname);
        console.log(filename);
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

app.post("/", upload, (req, res) => {
  const { file } = req;
  const { id } = file;
  console.log("the file uploaded id is:" + id);

  const fileInfo = new File({
    originalFilename: req.file.originalname,
    fileSize: fileSizeFormatter(req.file.size, 2),
    fileType: req.file.mimetype,
    UploadedDate: req.file.uploadDate,
    ValidTillDate: tomorrow,
    fileId: id,
    encryptedFileName: req.file.filename,
    senderName: "Harsini",
    iconFileFormat: getFileExtension(req.file.filename),
  });
  console.log(fileInfo);
  //fileInfo.save();

  fileInfo.save(function (err, result) {
    if (err) {
      console.log(err);
    } else {
      console.log(result);
    }
  });
  //const { file } = req;
  // const { id } = file;
  //console.log(id);
  //const _id = new mongoose.Types.ObjectId(id);
  // console.log(_id);
  res.json({ file: req.file });
});

app.get("/download", (req, res) => {
  mongoose.connect(URI, function (error, db) {
    assert.ifError(error);

    var gridfsbucket = new mongodb.GridFSBucket(db, {
      chunkSizeBytes: 1024,
      bucketName: "fs",
    });
    gridfsbucket
      .openDownloadStreamByName("39d94b014b03dabe795b3b3eed16e0a2.jpg")
      .pipe(fs.createWriteStream("./39d94b014b03dabe795b3b3eed16e0a2.jpg"))
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

app.get("/getLink", function (req, res) {
  res.json({
    success: true,
    download: `http://localhost:3000/download?filename=${filename}`,
  });
});

/* let fetchFileData; */

/* app.get("/myUploadedfiles/:filename", (req, res) => {
  gfs2.files.findOne({ filename: req.params.filename }, (err, file) => {
    if (!file || file.length === 0) {
      return res.status(400).json({ err: "no file exists" });
    }
    fetchFileData = file._id;
    console.log(fetchFileData);
    return res.json(file);
  });
});

app.get("/myInfo", async (req, res) => {
  try {
    const file = await File.findOne({
      _id: "618ba3bd57eae41f9e3eede2",
    });
    if (!file) {
      return res.render("download", { error: "No file" });
    }
    return res.json(file);
  } catch (err) {
    return res.json({ err: "some error" });
  }
}); */

app.use("/showDetails", require("./routes/showDetails"));

app.listen(PORT, function () {
  console.log("App running on port " + PORT);
});
