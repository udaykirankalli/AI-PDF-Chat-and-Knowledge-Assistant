import { Schema, model, Types, type InferSchemaType } from "mongoose";

const citationSchema = new Schema(
  {
    documentId: String,
    title: String,
    chunkIndex: Number,
    score: Number
  },
  { _id: false }
);

const messageSchema = new Schema(
  {
    role: {
      type: String,
      enum: ["user", "assistant"],
      required: true
    },
    content: {
      type: String,
      required: true
    },
    citations: {
      type: [citationSchema],
      default: []
    }
  },
  {
    timestamps: true
  }
);

const chatSessionSchema = new Schema(
  {
    userId: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true,
      default: "New chat"
    },
    messages: {
      type: [messageSchema],
      default: []
    }
  },
  {
    timestamps: true
  }
);

export type ChatSessionRecord = InferSchemaType<typeof chatSessionSchema>;

export const ChatSession = model("ChatSession", chatSessionSchema);
