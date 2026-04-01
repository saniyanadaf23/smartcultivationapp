const express = require("express");
const router = express.Router();

// ✅ Middleware
const { verifyDevice, verifyToken } = require("../backend/middleware/auth");

// ================= ESP32 ROUTES =================

// 📡 ESP32 fetch config
router.get("/config", verifyDevice, (req, res) => {
  res.json({
    fan: "ON",
    motor: "OFF",
    light: "OFF",
    tempThreshold: 35,
    soilThreshold: 1200,
  });
});

// 📤 ESP32 sends sensor data
router.post("/data", verifyDevice, (req, res) => {
  console.log("📥 Data from ESP32:", req.body);

  res.json({
    message: "Data received successfully",
  });
});

// ================= FRONTEND ROUTES =================

// 🧑 User dashboard fetch config
router.get("/config/user", verifyToken, (req, res) => {
  res.json({
    fan: "ON",
    motor: "OFF",
    light: "OFF",
  });
});

module.exports = router;
