// Import necessary packages
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import path from "path";
import * as Sentry from "@sentry/browser";

// Initialize Express app
const app = express();

Sentry.init({
  dsn: "https://77a0d8b7353f4e31b2b8c0fd27084f4a@glitchtip.atanasovski.xyz/2",
  integrations: [Sentry.browserSessionIntegration()],
});

// Use body-parser middleware to parse JSON requests
app.use(bodyParser.json());

app.use(
  cors({
    origin: "*",
  })
);

process.on("SIGTERM", process.exit);
process.on("SIGINT", process.exit);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Serve static files from 'public' directory
app.use(express.static("public"));

app.get("/js/utils.js", (req, res) => {
  res.setHeader("Content-Type", "application/javascript");
  res.render("utils", { ledServerURL: process.env.LED_SERVER_URL });
});

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));
