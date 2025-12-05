import { Document, Schema, model } from "mongoose";

export interface IOffer extends Document {
  title: string;
  description: string;
  price: number;
  imageId?: string;
}

const OfferSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  imageId: { type: String },
});

export const Offer = model("Offer", OfferSchema, "offers");
