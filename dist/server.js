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
const MONGO_URI = "mongodb://127.0.0.1:27017/testdb";
mongoose_1.default
    .connect(MONGO_URI)
    .then(() => console.log("Connected to MongoDB"))
    .catch((err) => console.error("Mongo connection error:", err));
app.use(express_1.default.urlencoded({ extended: true }));
app.use(express_1.default.json());
app.use(express_1.default.static(path_1.default.join(__dirname, "..", "public")));
const imagesDir = path_1.default.join(__dirname, "..", "public", "images");
if (!fs_1.default.existsSync(imagesDir)) {
    fs_1.default.mkdirSync(imagesDir, { recursive: true });
}
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, imagesDir);
    },
    filename: (req, file, cb) => {
        const original = file.originalname;
        const ext = path_1.default.extname(original);
        const base = path_1.default.basename(original, ext).replace(/\s+/g, "_");
        const id = (0, uuid_1.v4)();
        const newName = `${base}_${id}${ext}`;
        cb(null, newName);
    },
});
const upload = (0, multer_1.default)({ storage });
app.post("/upload", upload.single("image"), async (req, res) => {
    try {
        const { title, description, price } = req.body;
        let imageId;
        if (req.file) {
            const filename = req.file.filename;
            const p = `public/images/${filename}`;
            const img = new Image_1.Image({
                filename,
                path: p,
            });
            const saved = await img.save();
            imageId = saved._id.toString();
        }
        const offer = new Offer_1.Offer({
            title,
            description,
            price: Number(price),
            imageId: imageId || undefined,
        });
        await offer.save();
        return res.status(201).json({ success: true });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ success: false });
    }
});
app.get("/offers", async (req, res) => {
    try {
        const offers = await Offer_1.Offer.find().lean();
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
                image: {
                    _id: image?._id || null,
                    filename: image?.filename || null,
                    path: image?.path || "public/images/noimage.jpg",
                },
            };
        }));
        return res.json(result);
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Failed to fetch offers" });
    }
});
app.get("/", (req, res) => {
    res.sendFile(path_1.default.join(__dirname, "..", "public", "index.html"));
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
});
