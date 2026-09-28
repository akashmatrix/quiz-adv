const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

const publicUser = (user) => ({
  id: user._id,
  _id: user._id,
  name: user.name,
  email: user.email,
  dob: user.dob || null,
  profession: user.profession || "",
  avatar: user.avatar || "avatar-01",
  profileImage: user.profileImage || "",
});

const makeToken = (user) =>
  jwt.sign(
    { id: user._id, name: user.name, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
const resendConfigured = Boolean(
  process.env.RESEND_API_KEY &&
  process.env.RESEND_FROM_EMAIL
);

console.log("=== RESEND CONFIG CHECK ===");
console.log(
  "RESEND_API_KEY:",
  process.env.RESEND_API_KEY ? "FOUND" : "MISSING"
);
console.log(
  "RESEND_FROM_EMAIL:",
  process.env.RESEND_FROM_EMAIL ? "FOUND" : "MISSING"
);
console.log("==========================");

const sendPasswordResetEmail = async ({ to, otp }) => {
  if (!resendConfigured) {
    throw new Error("RESEND_NOT_CONFIGURED");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM_EMAIL,
      to: [to],
      subject: "QuizNeon password reset code",
      text: `Your QuizNeon verification code is ${otp}. It expires in 10 minutes. If you did not request a password reset, you can ignore this email.`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;padding:24px;color:#111827">
          <h2 style="margin-bottom:8px">QuizNeon password reset</h2>
          <p>Use this verification code to reset your password:</p>
          <div style="font-size:32px;font-weight:800;letter-spacing:8px;padding:18px 0;color:#4f46e5">${otp}</div>
          <p>This code expires in 10 minutes.</p>
          <p style="color:#6b7280">If you did not request this, you can ignore this email.</p>
        </div>
      `,
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data?.message || data?.name || "Resend email request failed");
    error.status = response.status;
    error.details = data;
    throw error;
  }

  return data;
};

// REGISTER
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Please fill all fields" });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists with this email" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase(),
      password: hashedPassword,
      avatar: "avatar-01",
    });

    res.status(201).json({
      message: "Registered successfully",
      token: makeToken(user),
      user: publicUser(user),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error during registration" });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Please provide email and password" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    res.json({
      message: "Login successful",
      token: makeToken(user),
      user: publicUser(user),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error during login" });
  }
});

// GET PROFILE
router.get("/profile", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password -resetOtpHash -resetOtpExpires");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ user: publicUser(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not load profile" });
  }
});

// UPDATE PROFILE
router.put("/profile", authMiddleware, async (req, res) => {
  try {
    const { name, dob, profession, avatar, profileImage } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Name is required" });
    }

    if (name.trim().length > 80) {
      return res.status(400).json({ message: "Name is too long" });
    }

    if (profession && profession.length > 100) {
      return res.status(400).json({ message: "Profession is too long" });
    }

    // Uploaded profile photos are stored as a small data URL for this version.
    // The frontend limits images to 2 MB before sending them.
    if (profileImage && profileImage.length > 4_000_000) {
      return res.status(400).json({ message: "Profile photo is too large. Use an image under 2 MB." });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.name = name.trim();
    user.dob = dob ? new Date(dob) : null;
    user.profession = (profession || "").trim();
    user.avatar = avatar || user.avatar || "avatar-01";
    user.profileImage = profileImage || "";

    await user.save();

    res.json({
      message: "Profile updated successfully",
      token: makeToken(user),
      user: publicUser(user),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not update profile" });
  }
});

// REQUEST PASSWORD RESET OTP
router.post("/forgot-password", async (req, res) => {
  const genericMessage = "If an account exists for that email, a verification code has been sent.";

  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    if (!email) return res.status(400).json({ message: "Please enter your email address" });

    const user = await User.findOne({ email });

    // Do not disclose whether an email belongs to an account.
    if (!user) return res.json({ message: genericMessage });

    if (!resendConfigured) {
      console.error("Password reset requested but Resend is not configured.");
      return res.status(503).json({ message: "Email service is not configured on the server yet." });
    }

    const otp = String(crypto.randomInt(100000, 1000000));

    // Store only a hash of the OTP. The plain OTP is sent only by email.
    user.resetOtpHash = crypto.createHash("sha256").update(otp).digest("hex");
    user.resetOtpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    try {
      await sendPasswordResetEmail({ to: user.email, otp });
    } catch (mailError) {
      // Do not leave a valid OTP behind if the email provider rejected the message.
      user.resetOtpHash = null;
      user.resetOtpExpires = null;
      await user.save();
      console.error("Resend email error:", mailError.details || mailError.message);
      return res.status(502).json({ message: "Could not send verification email. Please try again later." });
    }

    res.json({ message: genericMessage });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not send verification code" });
  }
});

// VERIFY OTP
router.post("/verify-otp", async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const otp = String(req.body.otp || "").trim();

    if (!email || !/^\d{6}$/.test(otp)) {
      return res.status(400).json({ message: "Enter the 6-digit verification code" });
    }

    const user = await User.findOne({ email });
    if (!user || !user.resetOtpHash || !user.resetOtpExpires || user.resetOtpExpires < new Date()) {
      return res.status(400).json({ message: "Invalid or expired verification code" });
    }

    const hash = crypto.createHash("sha256").update(otp).digest("hex");
    if (hash !== user.resetOtpHash) {
      return res.status(400).json({ message: "Invalid or expired verification code" });
    }

    res.json({ message: "Code verified successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not verify code" });
  }
});

// RESET PASSWORD AFTER OTP
router.post("/reset-password", async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const otp = String(req.body.otp || "").trim();
    const newPassword = String(req.body.newPassword || "");

    if (!email || !/^\d{6}$/.test(otp) || !newPassword) {
      return res.status(400).json({ message: "Please complete all fields" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const user = await User.findOne({ email });
    if (!user || !user.resetOtpHash || !user.resetOtpExpires || user.resetOtpExpires < new Date()) {
      return res.status(400).json({ message: "Invalid or expired verification code" });
    }

    const hash = crypto.createHash("sha256").update(otp).digest("hex");
    if (hash !== user.resetOtpHash) {
      return res.status(400).json({ message: "Invalid or expired verification code" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetOtpHash = null;
    user.resetOtpExpires = null;
    await user.save();

    res.json({ message: "Password changed successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not reset password" });
  }
});

module.exports = router;
