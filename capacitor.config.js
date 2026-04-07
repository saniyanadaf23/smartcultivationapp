require("dotenv").config();

const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";
let allowNavigation = [];

try {
  allowNavigation = [new URL(apiUrl).host];
} catch {
  allowNavigation = [];
}

module.exports = {
  appId: "com.smartcultivation.app",
  appName: "SmartCultivation",
  webDir: "app-build",
  bundledWebRuntime: false,
  server: {
    androidScheme: "https",
    allowNavigation,
  },
};
