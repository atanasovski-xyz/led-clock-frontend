// Import necessary packages
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import path from "path";
import { createProxyMiddleware } from 'http-proxy-middleware';

// Initialize Express app
const app = express();

app.use(
  cors({
    origin: "*",
  })
);

// Set up LED server proxy to avoid CORS issues
const LED_SERVER_URL = process.env.LED_SERVER_URL || 'http://led.atanasovski.xyz:8000';
app.use('/api', createProxyMiddleware({
  target: LED_SERVER_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api': '', // Remove the /api prefix when forwarding
  },
  secure: false, // Allow self-signed certificates
  on: {
    error: (err, req, res) => {
      console.error("Proxy error:", err);
      if (res && 'statusCode' in res) {
        res.statusCode = 500;
        res.end("Proxy error");
      }
    }
  },
  logger: console,
}));

// Use body-parser middleware to parse JSON requests
app.use(bodyParser.json());

process.on("SIGTERM", process.exit);
process.on("SIGINT", process.exit);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Serve static files from 'public' directory
app.use(express.static("public"));

app.get("/js/utils.js", (req, res) => {
  res.setHeader("Content-Type", "application/javascript");
  // Change this to point to the local API proxy instead of the remote server
  res.render("utils", { ledServerURL: '/api' });
});

// Add a new endpoint for health check
app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

// Serve the main page
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));
