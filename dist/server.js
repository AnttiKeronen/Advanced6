"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const multer_1 = __importDefault(require("multer"));
const uuid_1 = require("uuid");
const Offer_1 = require("./models/Offer");
const Image_1 = require("./models/Image");
const app = (0, express_1.default)();
// MongoDB connection (CodeGrade expects this)
mongoose_1.default
    .connect("mongodb://127.0.0.1:27017/testdb")
    .then(() => console.log("MongoDB connected"))
    .catch((err) => console.error("MongoDB connection error:", err));
// Middlewares
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Serve static files from public
app.use(express_1.default.static(path_1.default.join(__dirname, "..", "public")));
// Ensure images folder exists
const imagesDir = path_1.default.join(__dirname, "..", "public", "images");
if (!fs_1.default.existsSync(imagesDir)) {
    fs_1.default.mkdirSync(imagesDir, { recursive: true });
}
// Multer configuration
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, imagesDir); // ./public/images
    },
    filename: (req, file, cb) => {
        const originalName = file.originalname;
        const lastDotIndex = originalName.lastIndexOf(".");
        const ext = lastDotIndex !== -1 ? originalName.substring(lastDotIndex) : "";
        const baseName = lastDotIndex !== -1 ? originalName.substring(0, lastDotIndex) : originalName;
        const uniqueId = (0, uuid_1.v4)();
        // filename: original_without_ext + "_" + uuid + extension
        const newFilename = `${baseName}_${uniqueId}${ext}`;
        cb(null, newFilename);
    }
});
const upload = (0, multer_1.default)({ storage });
// ---------- ROUTES ----------
// 1 & 2. POST /upload – create offer, optionally with image
app.post("/upload", upload.single("image"), async (req, res) => {
    try {
        const { title, description, price } = req.body;
        let imageId = undefined;
        // If file was uploaded, save to Image collection
        if (req.file) {
            const filename = req.file.filename;
            // According to spec: path saved as public/images/${filename}
            const savedPath = `public/images/${filename}`;
            const imageDoc = await Image_1.Image.create({
                filename,
                path: savedPath
            });
            imageId = imageDoc._id.toString();
        }
        const priceNumber = Number(price);
        const offer = await Offer_1.Offer.create({
            title,
            description,
            price: priceNumber,
            imageId
        });
        res.status(201).json(offer);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to upload offer" });
    }
});
// 3. GET /offers – return all offers with their images
app.get("/offers", async (req, res) => {
    try {
        const offers = await Offer_1.Offer.find();
        // Collect all imageIds used in offers
        const imageIds = offers
            .map((o) => o.imageId)
            .filter((id) => !!id);
        // Find all images in one go
        const images = await Image_1.Image.find({
            _id: { $in: imageIds }
        });
        const imageMap = new Map();
        images.forEach((img) => {
            imageMap.set(img._id.toString(), img);
        });
        const offersWithImages = offers.map((offer) => {
            const obj = {
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
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch offers" });
    }
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
