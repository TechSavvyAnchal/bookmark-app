const router = require("express").Router();
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const { OAuth2Client } = require("google-auth-library");
const validate = require("../middleware/validate");
const { registerSchema, loginSchema } = require("../validators/authValidator");
const { sendOTPEmail } = require("../services/emailService");
const auth = require("../middleware/auth");

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Generate 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// Helper for ReCAPTCHA
const verifyCaptcha = async (token) => {
  if (!token) return false;
  try {
    const res = await axios.post(
      `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${token}`
    );
    return res.data.success;
  } catch (err) {
    return false;
  }
};

router.post("/signup", validate(registerSchema), async (req, res) => {
  try {
    const { name, email, password, captchaToken } = req.body;

    // Verify Captcha
    const isCaptchaValid = await verifyCaptcha(captchaToken);
    if (!isCaptchaValid && process.env.NODE_ENV === "production") {
      return res.status(400).send("Invalid CAPTCHA");
    }

    let user = await User.findOne({ email });
    if (user) return res.status(400).send("User already exists");

    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    user = new User({ 
      name, 
      email, 
      password, 
      otp, 
      otpExpires,
      isVerified: false 
    });
    
    await user.save();
    await sendOTPEmail(email, otp);

    res.status(201).send({ msg: "OTP sent to email", email });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(404).send("User not found");
    if (user.isVerified) return res.status(400).send("Already verified");
    if (user.otp !== otp || user.otpExpires < Date.now()) {
      return res.status(400).send("Invalid or expired OTP");
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    const token = jwt.sign(
      { id: user._id, version: user.tokenVersion || 0 }, 
      process.env.JWT_SECRET || "secret",
      { expiresIn: "7d" }
    );

    res.send({ token, msg: "Email verified successfully" });
  } catch (err) {
    res.status(500).send("Verification failed");
  }
});

router.post("/login", validate(loginSchema), async (req, res) => {
  try {
    const { email, password, captchaToken } = req.body;

    // Verify Captcha (optional but good for login protection)
    if (captchaToken) {
       const isCaptchaValid = await verifyCaptcha(captchaToken);
       if (!isCaptchaValid && process.env.NODE_ENV === "production") {
         return res.status(400).send("Invalid CAPTCHA");
       }
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(400).send("Invalid credentials");
    
    if (!user.isVerified) {
      return res.status(403).send({ msg: "Email not verified", email });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(400).send("Invalid credentials");

    const token = jwt.sign(
      { id: user._id, version: user.tokenVersion || 0 }, 
      process.env.JWT_SECRET || "secret",
      { expiresIn: "7d" }
    );
    res.send({ token });
  } catch (err) {
    res.status(500).send("Server error");
  }
});

// Google Login
router.post("/google", async (req, res) => {
  try {
    const { credential } = req.body;
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const { name, email, sub, picture } = ticket.getPayload();

    let user = await User.findOne({ email });
    if (!user) {
      user = new User({ name, email, googleId: sub, avatar: picture, isVerified: true });
      await user.save();
    } else {
      user.googleId = sub;
      user.avatar = picture;
      user.isVerified = true; // Google users are pre-verified
      await user.save();
    }

    const token = jwt.sign(
      { id: user._id, version: user.tokenVersion || 0 }, 
      process.env.JWT_SECRET || "secret",
      { expiresIn: "7d" }
    );
    res.send({ token });
  } catch (err) {
    console.error("[GOOGLE AUTH ERROR]", err);
    res.status(401).send("Google authentication failed");
  }
});

// Facebook Login
router.post("/facebook", async (req, res) => {
  try {
    const { accessToken } = req.body;
    const fbRes = await axios.get(
      `https://graph.facebook.com/me?access_token=${accessToken}&fields=id,name,email,picture`
    );
    const { name, email, id, picture } = fbRes.data;

    if (!email) return res.status(400).send("Facebook account must have an email.");

    let user = await User.findOne({ email });
    if (!user) {
      user = new User({ name, email, facebookId: id, avatar: picture?.data?.url, isVerified: true });
      await user.save();
    } else {
      user.facebookId = id;
      user.avatar = picture?.data?.url;
      user.isVerified = true;
      await user.save();
    }

    const token = jwt.sign(
      { id: user._id, version: user.tokenVersion || 0 }, 
      process.env.JWT_SECRET || "secret",
      { expiresIn: "7d" }
    );
    res.send({ token });
  } catch (err) {
    res.status(401).send("Facebook authentication failed");
  }
});

// Update Profile (Name and Password)
router.put("/profile", auth, async (req, res) => {
  try {
    const { name, password } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).send("User not found");

    if (name) user.name = name;
    if (password) user.password = password; // Hashing handled by pre-save hook in User model

    await user.save();
    res.send({ msg: "Profile updated successfully", name: user.name });
  } catch (err) {
    res.status(500).send("Failed to update profile");
  }
});

// REVOKE ALL TOKENS (Logout from all devices / Fix compromised bookmarklet)
router.post("/revoke-tokens", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).send("User not found");

    user.tokenVersion = (user.tokenVersion || 0) + 1;
    await user.save();

    res.send({ msg: "All tokens revoked. Please log in again." });
  } catch (err) {
    res.status(500).send("Failed to revoke tokens");
  }
});

module.exports = router;
