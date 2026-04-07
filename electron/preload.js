const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("smartCultivationDesktop", {
  platform: "windows",
});
