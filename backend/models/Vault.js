const mongoose = require("mongoose");

const VaultSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  }],
  date: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Vault", VaultSchema);
