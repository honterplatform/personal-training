import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ["user", "assistant"], required: true },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const ConversationSchema = new mongoose.Schema(
  {
    key: { type: String, default: "default", unique: true },
    messages: { type: [MessageSchema], default: [] },
  },
  { timestamps: true }
);

export default mongoose.model("Conversation", ConversationSchema);
