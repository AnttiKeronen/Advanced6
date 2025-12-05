import express from "express";
import mongoose from "mongoose";
import path from "path";
import fs from "fs";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import { Offer } from "./models/Offer";
import { Image } from "./models/Image";
const app = express();
mongoose
  .connect("mongodb://127.0.0.1:27017/testdb")
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "..", "public")));
const imagesDir = path.join(__dirname, "..", "public", "images");
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, imagesDir); 
  },
  filename: (req, file, cb) => {
    const originalName = file.originalname;
    const lastDotIndex = originalName.lastIndexOf(".");
    const ext =
      lastDotIndex !== -1 ? originalName.substring(lastDotIndex) : "";
    const baseName =
      lastDotIndex !== -1 ? originalName.substring(0, lastDotIndex) : originalName;
    const uniqueId = uuidv4();
    const newFilename = `${baseName}_${uniqueId}${ext}`;
    cb(null, newFilename);
  }
});
const upload = multer({ storage });
app.post("/upload", upload.single("image"), async (req, res) => {
  try {
    const { title, description, price } = req.body;
    let imageId: string | undefined = undefined;
    if (req.file) {
      const filename = req.file.filename;
      const savedPath = `public/images/${filename}`;
      const imageDoc = await Image.create({
        filename,
        path: savedPath
      });
      imageId = imageDoc._id.toString();
    }
    const priceNumber = Number(price);
    const offer = await Offer.create({
      title,
      description,
      price: priceNumber,
      imageId
    });
    res.status(201).json(offer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to upload offer" });
  }
});
app.get("/offers", async (req, res) => {
  try {
    const offers = await Offer.find();
    const imageIds = offers
      .map((o) => o.imageId)
      .filter((id): id is string => !!id);
    const images = await Image.find({
      _id: { $in: imageIds }
    });

    const imageMap = new Map<string, any>();
    images.forEach((img) => {
      imageMap.set(img._id.toString(), img);
    });
    const offersWithImages = offers.map((offer) => {
      const obj: any = {
        _id: offer._id,
        title: offer.title,
        description: offer.description,
        price: offer.price
      };
      if (offer.imageId) {
        const img = imageMap.get(offer.imageId);
        if (img) {
          obj.image = {
            _id: img._id,
            filename: img.filename,
            path: img.path
          };
        }
      }

      return obj;
    });
    res.json(offersWithImages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Fail" });
  }
});
const PORT = 3000;
app.listen(PORT, () => {
  console.log("Server running on port 3000");
});

