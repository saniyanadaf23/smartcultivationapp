// ── src/pages/FirmwareUpload.jsx ─────────────────────────────────────
// Admin-only panel to upload ESP32 OTA firmware (.bin file)
// Shows current version, upload UI, and status feedback.

import { useState, useEffect, useRef } from "react";
import {
  Box, Typography, Button, LinearProgress, Alert, Chip,
} from "@mui/material";
import { motion } from "framer-motion";
import { getFirmwareInfo, uploadFirmware } from "../services/api";

// ── Format timestamp version → readable date ─────────────────────────
function formatVersion(version) {
  if (!version) return "—";
  const n = Number(version);
  if (!isNaN(n) && n > 1_000_000_000_000) {
    return new Date(n).toLocaleString();
  }
  return version;
}

export default function FirmwareUpload() {
  const [file,           setFile]           = useState(null);
  const [uploading,      setUploading]      = useState(false);
  const [progress,       setProgress]       = useState(0);
  const [status,         setStatus]         = useState(null);   // { type, message }
  const [currentVersion, setCurrentVersion] = useState(null);
  const [currentUrl,     setCurrentUrl]     = useState(null);
  const [loadingInfo,    setLoadingInfo]     = useState(true);
  const fileInputRef = useRef();

  // ── Fetch current firmware info on mount ─────────────────────────────
  useEffect(() => {
    async function fetchInfo() {
      try {
        const data = await getFirmwareInfo();
        setCurrentVersion(data.version);
        setCurrentUrl(data.url);
      } catch (_) {
        // silently ignore — server may not have firmware yet
      } finally {
        setLoadingInfo(false);
      }
    }
    fetchInfo();
  }, []);

  // ── File selection ────────────────────────────────────────────────────
  function handleFileChange(e) {
    const f = e.target.files[0];
    setStatus(null);
    if (!f) { setFile(null); return; }

    if (!f.name.endsWith(".bin")) {
      setStatus({ type: "error", message: "Only .bin firmware files are accepted." });
      setFile(null);
      e.target.value = "";
      return;
    }
    setFile(f);
  }

  // ── Upload ────────────────────────────────────────────────────────────
  async function handleUpload() {
    if (!file) {
      setStatus({ type: "warning", message: "Please select a .bin file first." });
      return;
    }

    setUploading(true);
    setProgress(0);
    setStatus(null);

    // Simulate upload progress (XHR for real progress)
    try {
      const data = await uploadFirmware(file, (pct) => setProgress(pct));

      if (!data.success) throw new Error(data.error || "Upload failed");

      setCurrentVersion(data.version);
      setCurrentUrl(data.url);
      setStatus({
        type: "success",
        message: `✅ Firmware uploaded! Version: ${formatVersion(data.version)}`,
      });
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setProgress(100);

    } catch (err) {
      setStatus({ type: "error", message: `Upload failed: ${err.message}` });
      setProgress(0);
    } finally {
      setUploading(false);
    }
  }

  // ── UI ────────────────────────────────────────────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Box
        sx={{
          background: "rgba(8,18,12,0.85)",
          border: "1px solid rgba(74,222,128,0.15)",
          borderRadius: "16px",
          p: { xs: 2.5, md: 4 },
          maxWidth: 540,
        }}
      >
        {/* ── Header ───────────────────────────────────────────────── */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
          <Typography sx={{ fontSize: 22 }}>📦</Typography>
          <Box>
            <Typography
              sx={{
                fontFamily: "'Cormorant Garamond',serif",
                fontSize: "1.5rem",
                fontWeight: 400,
                color: "#e8f5e9",
                lineHeight: 1.2,
              }}
            >
              Firmware Update
            </Typography>
            <Typography
              sx={{
                fontSize: 11,
                color: "rgba(232,245,233,0.35)",
                fontFamily: "'JetBrains Mono',monospace",
                mt: 0.3,
              }}
            >
              OTA · ESP32 · Admin only
            </Typography>
          </Box>
        </Box>

        {/* ── Current firmware info ─────────────────────────────────── */}
        <Box
          sx={{
            background: "rgba(74,222,128,0.04)",
            border: "1px solid rgba(74,222,128,0.12)",
            borderRadius: "10px",
            p: 2,
            mb: 3,
          }}
        >
          <Typography
            sx={{
              fontSize: 11,
              color: "rgba(232,245,233,0.35)",
              fontFamily: "'JetBrains Mono',monospace",
              mb: 1,
              letterSpacing: 0.5,
              textTransform: "uppercase",
            }}
          >
            Current Firmware
          </Typography>

          {loadingInfo ? (
            <Typography
              sx={{ fontSize: 12, color: "rgba(232,245,233,0.3)", fontFamily: "'JetBrains Mono',monospace" }}
            >
              Loading…
            </Typography>
          ) : currentVersion ? (
            <>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                <Chip
                  label={`v${formatVersion(currentVersion)}`}
                  size="small"
                  sx={{
                    fontFamily: "'JetBrains Mono',monospace",
                    fontSize: 11,
                    background: "rgba(74,222,128,0.12)",
                    color: "#4ade80",
                    border: "1px solid rgba(74,222,128,0.25)",
                    height: 22,
                  }}
                />
              </Box>
              {currentUrl && (
                <Typography
                  sx={{
                    fontSize: 10,
                    color: "rgba(232,245,233,0.25)",
                    fontFamily: "'JetBrains Mono',monospace",
                    mt: 0.8,
                    wordBreak: "break-all",
                  }}
                >
                  {currentUrl}
                </Typography>
              )}
            </>
          ) : (
            <Typography
              sx={{
                fontSize: 12,
                color: "rgba(232,245,233,0.3)",
                fontFamily: "'JetBrains Mono',monospace",
              }}
            >
              No firmware uploaded yet
            </Typography>
          )}
        </Box>

        {/* ── File picker ──────────────────────────────────────────────── */}
        <Box sx={{ mb: 2 }}>
          <Typography
            sx={{
              fontSize: 11,
              color: "rgba(232,245,233,0.4)",
              fontFamily: "'JetBrains Mono',monospace",
              mb: 1,
              letterSpacing: 0.5,
              textTransform: "uppercase",
            }}
          >
            Select .bin File
          </Typography>

          {/* Styled file input area */}
          <Box
            onClick={() => !uploading && fileInputRef.current?.click()}
            sx={{
              border: `1px dashed ${file ? "rgba(74,222,128,0.45)" : "rgba(74,222,128,0.2)"}`,
              borderRadius: "10px",
              p: 2.5,
              textAlign: "center",
              cursor: uploading ? "not-allowed" : "pointer",
              background: file ? "rgba(74,222,128,0.04)" : "transparent",
              transition: "all 0.2s",
              "&:hover": {
                borderColor: uploading ? undefined : "rgba(74,222,128,0.4)",
                background: uploading ? undefined : "rgba(74,222,128,0.03)",
              },
            }}
          >
            <Typography sx={{ fontSize: 20, mb: 0.5 }}>
              {file ? "📄" : "⬆️"}
            </Typography>
            <Typography
              sx={{
                fontSize: 12,
                color: file ? "#4ade80" : "rgba(232,245,233,0.4)",
                fontFamily: "'JetBrains Mono',monospace",
              }}
            >
              {file ? file.name : "Click to browse .bin file"}
            </Typography>
            {file && (
              <Typography
                sx={{
                  fontSize: 10,
                  color: "rgba(232,245,233,0.25)",
                  fontFamily: "'JetBrains Mono',monospace",
                  mt: 0.5,
                }}
              >
                {(file.size / 1024).toFixed(1)} KB
              </Typography>
            )}
          </Box>
          <input
            ref={fileInputRef}
            type="file"
            accept=".bin"
            onChange={handleFileChange}
            style={{ display: "none" }}
          />
        </Box>

        {/* ── Upload progress bar ──────────────────────────────────────── */}
        {uploading && (
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
              <Typography
                sx={{ fontSize: 11, color: "rgba(232,245,233,0.4)", fontFamily: "'JetBrains Mono',monospace" }}
              >
                Uploading…
              </Typography>
              <Typography
                sx={{ fontSize: 11, color: "#4ade80", fontFamily: "'JetBrains Mono',monospace" }}
              >
                {progress}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{
                borderRadius: 4,
                height: 4,
                background: "rgba(74,222,128,0.1)",
                "& .MuiLinearProgress-bar": { background: "#4ade80", borderRadius: 4 },
              }}
            />
          </Box>
        )}

        {/* ── Status message ───────────────────────────────────────────── */}
        {status && (
          <Alert
            severity={status.type}
            sx={{
              mb: 2,
              fontSize: 12,
              fontFamily: "'JetBrains Mono',monospace",
              background:
                status.type === "success"
                  ? "rgba(74,222,128,0.08)"
                  : status.type === "error"
                  ? "rgba(248,113,113,0.08)"
                  : "rgba(251,191,36,0.08)",
              border: `1px solid ${
                status.type === "success"
                  ? "rgba(74,222,128,0.25)"
                  : status.type === "error"
                  ? "rgba(248,113,113,0.25)"
                  : "rgba(251,191,36,0.25)"
              }`,
              color:
                status.type === "success"
                  ? "#4ade80"
                  : status.type === "error"
                  ? "#f87171"
                  : "#fbbf24",
              "& .MuiAlert-icon": {
                color: "inherit",
              },
            }}
          >
            {status.message}
          </Alert>
        )}

        {/* ── Upload button ─────────────────────────────────────────────── */}
        <Button
          onClick={handleUpload}
          disabled={uploading || !file}
          fullWidth
          sx={{
            py: 1.3,
            fontSize: 13,
            fontFamily: "'JetBrains Mono',monospace",
            fontWeight: 500,
            letterSpacing: 0.5,
            borderRadius: "10px",
            background: uploading || !file
              ? "rgba(74,222,128,0.05)"
              : "rgba(74,222,128,0.12)",
            border: `1px solid ${
              uploading || !file
                ? "rgba(74,222,128,0.1)"
                : "rgba(74,222,128,0.35)"
            }`,
            color: uploading || !file ? "rgba(74,222,128,0.3)" : "#4ade80",
            "&:hover": {
              background: "rgba(74,222,128,0.18)",
              border: "1px solid rgba(74,222,128,0.5)",
            },
            transition: "all 0.2s",
          }}
        >
          {uploading ? "Uploading…" : "⬆ Upload Firmware"}
        </Button>

        {/* ── Warning note ─────────────────────────────────────────────── */}
        <Typography
          sx={{
            fontSize: 10,
            color: "rgba(232,245,233,0.2)",
            fontFamily: "'JetBrains Mono',monospace",
            mt: 2,
            lineHeight: 1.6,
          }}
        >
          ⚠ Uploading overwrites the existing esp32.bin on the server. All
          connected ESP32 devices will receive the OTA update on their next
          config poll.
        </Typography>
      </Box>
    </motion.div>
  );
}