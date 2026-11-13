import express from "express";
import path from "path";
import fs from "fs";

const app = express();

// Set body parser limits to support larger base64 file payloads
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Resolve upload directories dynamically
const UPLOADS_DIR = process.env.VERCEL ? "/tmp" : path.join(process.cwd(), "uploads");
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Serve static files from uploads directory (e.g. for temporary visual verifications)
app.use("/uploads", express.static(UPLOADS_DIR));

// API Routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Base64 file upload endpoint
app.post("/api/upload", (req, res) => {
  try {
    const { filename, base64 } = req.body;
    if (!base64 || !filename) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    let base64Data = base64;
    if (base64.includes(";base64,")) {
      base64Data = base64.split(";base64,").pop() || "";
    }

    if (!base64Data) {
      return res.status(400).json({ error: "Invalid base64 payload" });
    }

    // Direct base64 bypass on ephemeral/serverless environments like Vercel.
    // This perfectly prevents files disappearing on different lambda cold-starts!
    if (process.env.VERCEL) {
      return res.json({ url: base64 });
    }

    const buffer = Buffer.from(base64Data, "base64");
    const cleanExt = path.extname(filename) || ".png";
    const cleanBase = path.basename(filename, cleanExt).replace(/[^a-zA-Z0-9_\-]/g, "");
    const uniqueFilename = `${cleanBase}_${Date.now()}${cleanExt}`;
    const filePath = path.join(UPLOADS_DIR, uniqueFilename);

    fs.writeFileSync(filePath, buffer);

    res.json({ url: `/uploads/${uniqueFilename}` });
  } catch (error) {
    console.error("Upload handler error:", error);
    res.status(500).json({ error: "Internal server error during upload" });
  }
});

// Only start Express listener on local/container execution where process.env.VERCEL is falsy
if (!process.env.VERCEL) {
  const PORT = Number(process.env.PORT) || 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express server running locally on port ${PORT}`);
  });
}

export default app;
