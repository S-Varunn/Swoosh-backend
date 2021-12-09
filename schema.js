require("dotenv").config();
const mongoose = require("mongoose");
const Schema = mongoose.Schema;
mongoose.connect(process.env.MONGO_CONNECTION_URL);
//var db= mongoose.connection;

//file schema for mongodb upload to avoid unnecessary data upload
const fileSchema = new Schema(
  {
    originalFilename: { type: String, required: true },
    fileSize: { type: String, required: true },
    fileType: { type: String, required: true },
    UploadedDate: { type: String, required: true },
    ValidTillDate: { type: String, required: false },
    fileId: { type: Schema.Types.ObjectId, required: true },
    encryptedFileName: { type: String, required: true },
    senderName: { type: String, required: false },
    iconFileFormat: { type: String, required: true },
  },
  { timestamps: true }
);
module.exports = mongoose.model("File", fileSchema);
