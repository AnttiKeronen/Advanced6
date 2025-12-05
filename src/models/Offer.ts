import { Document, Schema, model } from "mongoose";

export interface IOffer extends Document {
  title: string;
  description: string;
  price: number;
  imageId?: string; // optional, offer may exist without an image
}

const OfferSchema = new Schema<IOffer>({
  title: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  imageId: { type: String, required: false },
});

export const Offer = model<IOffer>("Offer", OfferSchema, "offers");
