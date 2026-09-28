const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true }, // stored as bcrypt hash

    // Profile
    dob: { type: Date, default: null },
    profession: { type: String, trim: true, maxlength: 100, default: "" },
    avatar: { type: String, default: "avatar-01" },
    profileImage: { type: String, default: "" },

    // Password reset OTP (temporary)
    resetOtpHash: { type: String, default: null },
    resetOtpExpires: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);
