require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const jwt = require("jsonwebtoken");
const Vault = require("./models/Vault");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "x-auth-token", "Authorization"]
  }
});

// Attach io to app to use in routes
app.set("io", io);

// Socket Auth Middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error("Authentication error"));
  
  jwt.verify(token, process.env.JWT_SECRET || "secret", (err, decoded) => {
    if (err) return next(new Error("Authentication error"));
    socket.user = decoded;
    next();
  });
});

io.on("connection", async (socket) => {
  const userId = socket.user.id.toString();
  console.log(`[SOCKET] User connected: ${userId}`);
  
  // Join personal room
  socket.join(`user_${userId}`);
  console.log(`[SOCKET] User joined personal room: user_${userId}`);
  
  // Join rooms for each vault the user is a member of
  try {
    const userVaults = await Vault.find({ members: socket.user.id });
    userVaults.forEach(vault => {
      const vaultId = vault._id.toString();
      socket.join(`vault_${vaultId}`);
      console.log(`[SOCKET] User ${userId} joined vault room: ${vaultId}`);
    });
  } catch (err) {
    console.error("[SOCKET] Error joining vault rooms:", err);
  }

  socket.on("disconnect", () => {
    console.log(`[SOCKET] User disconnected: ${userId}`);
  });
});

// Security Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false, // Disable CSP headers to avoid blocking the bookmarklet from our side
}));

// Enhanced CORS - Allow all origins for bookmarklet compatibility
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "x-auth-token", "Authorization"],
  credentials: false 
}));

app.use(express.json());

// Simple request logger for production
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// DB connect
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.error("MongoDB Connection Error:", err));

const { initCronJobs } = require("./services/cronJobs");

// Initialize Cron Jobs
try {
  initCronJobs();
} catch (e) {
  console.error("Cron jobs failed to init:", e.message);
}

// Routes
app.use("/auth", require("./routes/auth"));
app.use("/links", require("./routes/link"));
app.use("/vaults", require("./routes/vault"));

// Test route
app.get("/", (req, res) => {
  res.send("API Running");
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("[UNHANDLED ERROR]", err);
  res.status(500).send({ msg: "Internal Server Error", error: err.message });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});