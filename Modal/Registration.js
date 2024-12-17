const mongoose = require("mongoose");

// Define the Registration Schema
const registrationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },

  password: {
    type: String,
    required: true
  },
  city: {
    type: String,
    required: true
  },
  network: {
    type: Number,
    required: true
  },
  cardamount: {
    type: Number,
    default: 110000
  },
  number: {
    type: String,
    required: true,
    match: [/^\d{10}$/, "Please use a valid phone number."] // Phone validation
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Export the model
module.exports = mongoose.model("Registration", registrationSchema);
