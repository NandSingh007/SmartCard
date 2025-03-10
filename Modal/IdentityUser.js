const mongoose = require("mongoose");

const IdentityUserSchema = new mongoose.Schema(
  {
    UserId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User"
    },
    FatherName: {
      type: String,
      required: true
    },
    IdentityStatus: {
      type: Number,
      default: 0
    },
    email: {
      type: String,
      required: true
    },
    EmployType: {
      type: String,

      required: true
    },
    gender: {
      type: String,

      required: true
    },
    AdharcardNumber: {
      type: String,
      required: true,
      unique: true
    },
    PancardNumber: {
      type: String,
      required: true,
      unique: true
    },
    // adharFrontPageImg: {
    //   type: String,
    //   required: true
    // },
    // adharBackPageImg: {
    //   type: String,
    //   required: true
    // },
    // panCardPageImg: {
    //   type: String,
    //   required: true
    // },
    FirstPayStatus: {
      type: Number,
      default: 0
    },
    SecondPayStatus: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("IdentityUser", IdentityUserSchema);
