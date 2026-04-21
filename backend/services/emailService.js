const nodemailer = require("nodemailer");
const Link = require("../models/Link");
const User = require("../models/User");

// Create a transporter (using placeholders - in a real app, use .env)
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.ethereal.email",
  port: process.env.EMAIL_PORT || 587,
  auth: {
    user: process.env.EMAIL_USER || "placeholder@ethereal.email",
    pass: process.env.EMAIL_PASS || "password123",
  },
});

const sendWeeklyDigest = async (user) => {
  try {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    // 1. Get top 3 links from the last week
    const recentLinks = await Link.find({ 
      user: user._id, 
      createdAt: { $gte: oneWeekAgo } 
    }).sort({ createdAt: -1 }).limit(3);

    // 2. Get a "Forgotten Gem" (older than 1 month)
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    const oldLinks = await Link.find({
      user: user._id,
      createdAt: { $lte: oneMonthAgo }
    });
    const forgottenGem = oldLinks.length > 0 
      ? oldLinks[Math.floor(Math.random() * oldLinks.length)] 
      : null;

    if (recentLinks.length === 0 && !forgottenGem) return;

    console.log(`Generating weekly digest for ${user.email}...`);

    const emailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h1 style="color: #4f46e5; text-align: center;">Weekly Digest 📚</h1>
        <p>Hi ${user.name}, here's your weekly summary from AI Bookmarks.</p>
        
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
        
        <h2 style="color: #1f2937;">✨ Top 3 New Bookmarks</h2>
        ${recentLinks.map(link => `
          <div style="margin-bottom: 20px;">
            <h3 style="margin: 0;"><a href="${link.url}" style="color: #4f46e5; text-decoration: none;">${link.title}</a></h3>
            <p style="color: #4b5563; font-size: 14px; margin: 5px 0;">${link.summary}</p>
            <span style="font-size: 12px; color: #9ca3af;">#${link.category} • ${link.readTime} min read</span>
          </div>
        `).join('')}
        
        ${forgottenGem ? `
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
          <h2 style="color: #1f2937;">💎 Forgotten Gem</h2>
          <div style="background: #f9fafb; padding: 15px; rounded: 10px; border-left: 4px solid #4f46e5;">
             <h3 style="margin: 0;"><a href="${forgottenGem.url}" style="color: #4f46e5; text-decoration: none;">${forgottenGem.title}</a></h3>
             <p style="color: #4b5563; font-size: 14px; margin: 5px 0;">${forgottenGem.summary}</p>
          </div>
        ` : ''}
        
        <div style="text-align: center; margin-top: 40px; color: #9ca3af; font-size: 12px;">
          <p>You received this because you're using AI Bookmarks.</p>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: `"AI Bookmarks" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: "Your Weekly Knowledge Digest 📚",
      html: emailHtml,
    });
    console.log(`Weekly digest simulated for ${user.email}`);

  } catch (err) {
    console.error("Error sending weekly digest:", err);
  }
};

const sendVaultInvitation = async (toEmail, inviterName, vaultName) => {
  try {
    const signupUrl = "http://localhost:5173/signup"; // Use your actual frontend URL
    const emailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px; background: #fdfdfd; color: #333;">
        <h1 style="color: #4f46e5; text-align: center;">You're Invited! 📬</h1>
        <p>Hi there,</p>
        <p><strong>${inviterName}</strong> has invited you to collaborate in their AI Bookmark Vault: <strong>${vaultName}</strong>.</p>
        
        <div style="background: #f4f4f4; padding: 20px; border-radius: 12px; margin: 20px 0; text-align: center;">
          <p style="font-size: 16px; font-weight: bold; margin-bottom: 20px;">Join the conversation and start sharing links today!</p>
          <a href="${signupUrl}" style="display: inline-block; padding: 12px 24px; background: #4f46e5; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">
            Sign Up Now
          </a>
        </div>
        
        <p style="font-size: 12px; color: #666; margin-top: 40px;">
          If you don't know ${inviterName} or were not expecting this invitation, you can safely ignore this email.
        </p>
        
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
        <div style="text-align: center; color: #9ca3af; font-size: 11px;">
          <p>Sent via AI Bookmarking App • Built for better research.</p>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: toEmail,
      subject: `Invitation to collaborate on "${vaultName}" 📚`,
      html: emailHtml,
    });
    console.log(`Vault invitation email sent to ${toEmail}`);
    return true;
  } catch (err) {
    console.error("Error sending vault invitation:", err);
    return false;
  }
};

const sendOTPEmail = async (toEmail, otp) => {
  try {
    const emailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px; text-align: center;">
        <h1 style="color: #4f46e5;">Verify Your Email 🛡️</h1>
        <p>Your verification code for AI Bookmarks is:</p>
        <div style="background: #f3f4f6; padding: 20px; border-radius: 12px; margin: 20px 0;">
          <h2 style="font-size: 32px; letter-spacing: 5px; margin: 0; color: #111827;">${otp}</h2>
        </div>
        <p style="color: #6b7280; font-size: 14px;">This code will expire in 10 minutes.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 11px; color: #9ca3af;">If you didn't request this, you can ignore this email.</p>
      </div>
    `;

    await transporter.sendMail({
      from: `"AI Bookmarks" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: `${otp} is your verification code`,
      html: emailHtml,
    });
    console.log(`OTP email sent to ${toEmail}`);
    return true;
  } catch (err) {
    console.error("Error sending OTP email:", err);
    return false;
  }
};

module.exports = { sendWeeklyDigest, sendVaultInvitation, sendOTPEmail };
