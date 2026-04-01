// ── routes/firmware.js ───────────────────────────────────────────────
const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const auth = require("../backend/middleware/auth");

module.exports = function (mongoose) {
  const router = express.Router();

  // ── Multer: always overwrite as esp32.bin ───────────────────────────
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = path.join(__dirname, "../backend/firmware");
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      cb(null, "esp32.bin");
    },
  });

  // ── File-type guard: .bin only ──────────────────────────────────────
  const fileFilter = (req, file, cb) => {
    if (
      file.originalname.endsWith(".bin") ||
      file.mimetype === "application/octet-stream"
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only .bin firmware files are accepted"), false);
    }
  };

  const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max
  });

  // ── Admin-only guard ────────────────────────────────────────────────
  function adminOnly(req, res, next) {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }
    next();
  }

  // ════════════════════════════════════════════════════════════════════
  // POST /api/firmware/upload
  // ════════════════════════════════════════════════════════════════════
  router.post(
    "/upload",
    auth,
    adminOnly,
    upload.single("file"),
    async (req, res) => {
      if (!req.file) {
        return res.status(400).json({ error: "No file received" });
      }

      try {
        const version = Date.now().toString();
        const localIp = process.env.LOCAL_IP || "localhost";
        const port = process.env.PORT || 5000;
        const firmwareUrl = `http://${localIp}:${port}/firmware/esp32.bin`;

        // Use the mongoose instance injected from server.js
        const db = mongoose.connection.db;
        await db.collection("configs").updateMany(
          {},
          {
            $set: {
              "firmware.version": version,
              "firmware.url": firmwareUrl,
              "firmware.updatedAt": new Date(),
            },
          }
        );

        console.log(`📦 Firmware uploaded  → version: ${version}`);
        console.log(`🔗 Firmware URL       → ${firmwareUrl}`);

        res.json({
          success: true,
          message: "Firmware uploaded successfully",
          version,
          url: firmwareUrl,
        });
      } catch (error) {
        console.error("Firmware upload error:", error.message);
        res.status(500).json({ error: "Firmware upload failed" });
      }
    }
  );

  // ════════════════════════════════════════════════════════════════════
  // GET /api/firmware/info
  // ════════════════════════════════════════════════════════════════════
  router.get("/info", auth, async (req, res) => {
    try {
      const doc = await mongoose.connection.db
        .collection("configs")
        .findOne({}, { projection: { firmware: 1 } });

      if (!doc?.firmware?.version) {
        return res.json({
          version: null,
          url: null,
          message: "No firmware uploaded yet",
        });
      }

      res.json({
        version: doc.firmware.version,
        url: doc.firmware.url,
        updatedAt: doc.firmware.updatedAt,
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
};
