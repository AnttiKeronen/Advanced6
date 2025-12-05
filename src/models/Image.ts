import { Document, Schema, model } from "mongoose";

export interface IImage extends Document {
  filename: string;
  path: string;
}

const ImageSchema = new Schema({
  filename: { type: String, required: true },
  path: { type: String, required: true },
});

export const Image = model("Image", ImageSchema, "images");
