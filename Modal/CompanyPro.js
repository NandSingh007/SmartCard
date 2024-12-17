const mongoose = require("mongoose");

const CompanyProfileSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      match: [/\S+@\S+\.\S+/, "Please use a valid email address."]
    },
    contactNo: {
      type: String,
      required: true
    },
    address: {
      type: String,
      required: true
    },
    charges1: {
      type: Number,
      required: true,
      min: [0, "Charges1 must be a positive number."]
    },
    upiId: {
      type: String,
      required: true
    },
    charges2: {
      type: Number,
      required: true,
      min: [0, "Charges2 must be a positive number."]
    },

    QRImg: {
      type: String,
      required: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("CompanyProfile", CompanyProfileSchema);
