"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const path_1 = __importDefault(require("path"));
const multer_1 = __importDefault(require("multer"));
const uuid_1 = require("uuid");
const fs_1 = __importDefault(require("fs"));
const Offer_1 = require("./models/Offer");
const Image_1 = require("./models/Image");
const app = (0, express_1.default)();
// --- Mongo connection ---
const MONGO_URI = "mongodb://127.0.0.1:27017/testdb";
mongoose_1.default
    .connect(MONGO_URI)
    .then(() => console.log("Connected to MongoDB"))
    .catch((err) => console.error("Mongo connection error:", err));
// --- Middlewares ---
app.use(express_1.default.urlencoded({ extended: true }));
app.use(express_1.default.json());
// Serve static files from public
app.use(express_1.default.static(path_1.default.join(__dirname, "..", "public")));
// Ensure images folder exists
const imagesDir = path_1.default.join(__dirname, "..", "public", "images");
if (!fs_1.default.existsSync(imagesDir)) {
    fs_1.default.mkdirSync(imagesDir, { recursive: true });
}
// --- Multer config ---
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, imagesDir);
    },
    filename: (req, file, cb) => {
        const originalName = file.originalname;
        const ext = path_1.default.extname(originalName); // .jpg, .png etc
        const baseName = path_1.default.basename(originalName, ext); // without extension
        const uniqueId = (0, uuid_1.v4)();
        // Optionally sanitize baseName a bit
        const safeBase = baseName.replace(/\s+/g, "_");
        const newFilename = `${safeBase}_${uniqueId}${ext}`;
        cb(null, newFilename);
    },
});
const upload = (0, multer_1.default)({ storage });
// --- Routes ---
// POST /upload: create offer, optionally with image
app.post("/upload", upload.single("image"), async (req, res) => {
    try {
        const { title, description, price } = req.body;
        let imageId;
        // If file exists, save to images collection
        if (req.file) {
            const filename = req.file.filename;
            const imagePath = `public/images/${filename}`;
            const imageDoc = new Image_1.Image({
                filename,
                path: imagePath,
            });
            const savedImage = await imageDoc.save();
            imageId = savedImage._id.toString();
        }
        const offer = new Offer_1.Offer({
            title,
            description,
            price: Number(price),
            imageId: imageId ? imageId : undefined,
        });
        const savedOffer = await offer.save();
        res.json({ success: true, offer: savedOffer });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: "Failed to upload offer" });
    }
});
// GET /offers: get all offers including their image data
app.get("/offers", async (req, res) => {
    try {
        const offers = await Offer_1.Offer.find().lean();
        // For each offer, find corresponding image by imageId (if exists)
        const result = await Promise.all(offers.map(async (offer) => {
            let image = null;
            if (offer.imageId) {
                image = await Image_1.Image.findById(offer.imageId).lean();
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
                        path: image.path, // e.g. "public/images/file.png"
                    }
                    : null,
            };
        }));
        res.json(result);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch offers" });
    }
});
// Serve index.html at root
app.get("/", (req, res) => {
    res.sendFile(path_1.default.join(__dirname, "..", "public", "index.html"));
});
// --- Start server ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
});
