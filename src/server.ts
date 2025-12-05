import express from "express";
import mongoose from "mongoose";
import path from "path";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import { Offer } from "./models/Offer";
import { Image } from "./models/Image";

const app = express();
const MONGO_URI = "mongodb://127.0.0.1:27017/testdb";
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("Mongo connection error:", err));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

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
    const ext = path.extname(originalName);
    const baseName = path.basename(originalName, ext);
    const uniqueId = uuidv4();
    const safeBase = baseName.replace(/\s+/g, "_");

    const newFilename = `${safeBase}_${uniqueId}${ext}`;
    cb(null, newFilename);
  },
});
const upload = multer({ storage });
app.post("/upload", upload.single("image"), async (req, res) => {
  try {
    const { title, description, price } = req.body;
    let imageId: string | undefined;
    if (req.file) {
      const filename = req.file.filename;
      const imagePath = `public/images/${filename}`;
      const imageDoc = new Image({
        filename,
        path: imagePath,
      });
      const savedImage = await imageDoc.save();
      imageId = savedImage._id.toString();
    }

    const offer = new Offer({
      title,
      description,
      price: Number(price),
      imageId: imageId || undefined,
    });
    await offer.save();
    return res.status(201).json({ success: true });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false });
  }
});


// Get all offers
app.get("/offers", async (req, res) => {
  try {
    const offers = await Offer.find().lean();

    const result = await Promise.all(
      offers.map(async (offer) => {
        let image = null;

        if (offer.imageId) {
          image = await Image.findById(offer.imageId).lean();
        }

        return {
          _id: offer._id,
          title: offer.title,
          description: offer.description,
          price: offer.price,
          image: image
            ? {
                _id: image._id,
                filename: image.filename,
                path: image.path,
              }
            : null,
        };
      })
    );

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch offers" });
  }
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "index.html"));
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
