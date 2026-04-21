const express = require("express");
const router = express.Router();
const Vault = require("../models/Vault");
const Link = require("../models/Link");
const User = require("../models/User");
const auth = require("../middleware/auth");
const { sendVaultInvitation } = require("../services/emailService");

// Create a new vault
router.post("/", auth, async (req, res) => {
  try {
    const { name, description } = req.body;
    const newVault = new Vault({
      name,
      description,
      creator: req.user.id,
      members: [req.user.id] // Creator is the first member
    });
    const vault = await newVault.save();
    res.json(vault);
  } catch (err) {
    res.status(500).send("Server Error");
  }
});

// Get all vaults for a user (created or joined)
router.get("/", auth, async (req, res) => {
  try {
    const vaults = await Vault.find({ members: req.user.id })
      .populate("creator", "name email")
      .populate("members", "name email")
      .sort({ date: -1 });
    res.json(vaults);
  } catch (err) {
    res.status(500).send("Server Error");
  }
});

// Remove a member from a vault
router.delete("/:id/members/:userId", auth, async (req, res) => {
  try {
    const vault = await Vault.findById(req.params.id);
    if (!vault) return res.status(404).json({ msg: "Vault not found" });

    // Only the creator can remove members, or members can remove themselves
    if (vault.creator.toString() !== req.user.id && req.params.userId !== req.user.id) {
      return res.status(401).json({ msg: "Not authorized to remove this member" });
    }

    // Cannot remove the creator
    if (req.params.userId === vault.creator.toString()) {
      return res.status(400).json({ msg: "Cannot remove the creator" });
    }

    vault.members = vault.members.filter(m => m.toString() !== req.params.userId);
    await vault.save();
    res.json(vault);
  } catch (err) {
    res.status(500).send("Server Error");
  }
});

// Add a member to a vault (by email)
router.post("/:id/share", auth, async (req, res) => {
  try {
    const { email } = req.body;
    const lowerEmail = email.toLowerCase().trim();
    const vault = await Vault.findById(req.params.id);
    const inviter = await User.findById(req.user.id);
    
    if (!vault) return res.status(404).json({ msg: "Vault not found" });
    if (vault.creator.toString() !== req.user.id) {
      return res.status(401).json({ msg: "Only the creator can share the vault" });
    }

    const userToShare = await User.findOne({ email: lowerEmail });
    
    // CASE 1: User doesn't exist yet
    if (!userToShare) {
      console.log(`User ${lowerEmail} not found. Sending invitation email...`);
      try {
        await sendVaultInvitation(lowerEmail, inviter?.name || "A friend", vault.name);
        return res.status(200).json({ msg: "Invitation email sent! They can join after signing up." });
      } catch (mailErr) {
        return res.status(200).json({ msg: "Invitation prepared, but email service failed. Check settings!" });
      }
    }

    // CASE 2: User exists but already a member
    if (vault.members.includes(userToShare._id)) {
      return res.status(400).json({ msg: "User already a member" });
    }

    // CASE 3: User exists and not a member - add them AND send notification
    vault.members.push(userToShare._id);
    await vault.save();
    
    try {
      await sendVaultInvitation(lowerEmail, inviter?.name || "A friend", vault.name);
      return res.json({ msg: `User ${userToShare.name} added and notified via email!` });
    } catch (err) {
      return res.json({ msg: `User ${userToShare.name} added, but notification email failed.` });
    }

  } catch (err) {
    res.status(500).send("Server Error");
  }
});

// Get links for a specific vault
router.get("/:id/links", auth, async (req, res) => {
  try {
    const vault = await Vault.findById(req.params.id);
    if (!vault || !vault.members.includes(req.user.id)) {
      return res.status(401).json({ msg: "Access denied" });
    }

    const links = await Link.find({ vault: req.params.id }).sort({ date: -1 });
    res.json(links);
  } catch (err) {
    res.status(500).send("Server Error");
  }
});

module.exports = router;
