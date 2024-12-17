const mongoose = require("mongoose");

const insuranceSchema = new mongoose.Schema(
  {
    bankName: {
      type: String,
      required: true,
      trim: true // Removes unnecessary whitespace
    },
    amount: {
      type: Number,
      required: true,
      min: 0 // Ensures the amount is not negative
    }
  },
  {
    timestamps: true // Adds `createdAt` and `updatedAt` fields
  }
);

module.exports = mongoose.model("Insurance", insuranceSchema);
