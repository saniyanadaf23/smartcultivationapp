// ── server.js ────────────────────────────────────────────────────────

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const path = require("path");
const AWS = require("aws-sdk");
const multer = require("multer");
const fs = require("fs");

const auth = require("./middleware/auth");

dotenv.config();

const app = express();

app.use(
  cors({
    origin: ["https://growio-eight.vercel.app"],
    credentials: true,
  })
);

app.use(express.json());

// ── MongoDB ──────────────────────────────────────────────────────────
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ Connected to chamberDB");
    startPolling();
  })
  .catch((err) => console.error("❌ MongoDB error:", err.message));

// ── Schemas ──────────────────────────────────────────────────────────
const telemetrySchema = new mongoose.Schema(
  {
    deviceId: String,
    temperature: Number,
    humidity: Number,
    soil: Number,
    soilStatus: String,
    light: String,
    fan: String,
    motor: String,
    time: Date,
  },
  { collection: "telemetry", strict: false }
);

const Telemetry = mongoose.model("Telemetry", telemetrySchema);

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: String,
  deviceId: String,
});

const User = mongoose.model("User", userSchema);

const configSchema = new mongoose.Schema(
  {
    deviceId: String,
    relays: Object,
    firmware: Object,
  },
  { collection: "configs" }
);

const Config = mongoose.model("Config", configSchema);

// ── AWS S3 CONFIG ────────────────────────────────────────────────────
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY,
  region: process.env.AWS_REGION,
});

// ── TEMP STORAGE ─────────────────────────────────────────────────────
const upload = multer({ dest: "temp/" });

// ════════════════════════════════════════════════════════════════════
// AUTH
// ════════════════════════════════════════════════════════════════════
app.post("/api/auth/login", async (req, res) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) return res.status(401).json({ error: "User not found" });

  const match = await bcrypt.compare(req.body.password, user.password);

  if (!match) return res.status(401).json({ error: "Wrong password" });

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

  res.json({ user, token });
});

// ════════════════════════════════════════════════════════════════════
// CONFIG
// ════════════════════════════════════════════════════════════════════
app.get("/api/config/:deviceId", async (req, res) => {
  const config = await Config.findOne({ deviceId: req.params.deviceId });

  if (!config) return res.json({ deviceId: req.params.deviceId, relays: {} });

  res.json(config);
});

// ════════════════════════════════════════════════════════════════════
// 🚀 FIRMWARE (S3 VERSION)
// ════════════════════════════════════════════════════════════════════

app.post(
  "/api/firmware/upload",
  auth,
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      console.log("🔥 S3 UPLOAD STARTED");

      const fileContent = fs.readFileSync(req.file.path);
      const fileName = `firmware/esp32_${Date.now()}.bin`;

      const params = {
        Bucket: process.env.S3_BUCKET_NAME,
        Key: fileName,
        Body: fileContent,
        ContentType: "application/octet-stream",
      };

      const data = await s3.upload(params).promise();

      const firmwareUrl = data.Location;

      const deviceId = "chamber-001";

      const updated = await Config.findOneAndUpdate(
        { deviceId },
        {
          firmware: {
            version: fileName,
            url: firmwareUrl,
            updatedAt: new Date(),
          },
        },
        { new: true, upsert: true }
      );

      fs.unlinkSync(req.file.path);

      console.log("🔥 DB UPDATED:", updated.firmware);

      res.json({
        success: true,
        version: fileName,
        url: firmwareUrl,
      });
    } catch (err) {
      console.error("❌ Upload error:", err);
      res.status(500).json({ error: err.message });
    }
  }
);

// 🔥 GET CURRENT FIRMWARE
app.get("/api/firmware/info", async (req, res) => {
  const config = await Config.findOne({ deviceId: "chamber-001" });

  if (!config?.firmware) {
    return res.json({ version: null, url: null });
  }

  res.json(config.firmware);
});

// ════════════════════════════════════════════════════════════════════
// HEALTH
// ════════════════════════════════════════════════════════════════════
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// ════════════════════════════════════════════════════════════════════
// START
// ════════════════════════════════════════════════════════════════════
const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log("🚀 Server running on port", PORT);
});
