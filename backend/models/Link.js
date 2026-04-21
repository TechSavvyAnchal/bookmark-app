const mongoose = require("mongoose");

const LinkSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  url: String,
  title: String,
  tags: [String],
  category: String,
  summary: String,
  readTime: Number,
  note: String,
  vault: { type: mongoose.Schema.Types.ObjectId, ref: 'Vault' },
  isPinned: { type: Boolean, default: false },
  embedding: { type: [Number], default: [] },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Link", LinkSchema);