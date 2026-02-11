import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import { authenticateApiKey, rateLimit, requestLogger, errorHandler } from "./middleware/auth.js";
import agentRoutes from "./routes/agent.js";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.AGENT_PORT || 3001;

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*",
    credentials: true,
  })
);

// Rate limiting
app.use(rateLimit(100, 60000)); // 100 requests per minute

// Body parsing
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// Request logging
app.use(requestLogger);

// Health check (no auth required)
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "bluepilot-agent",
    timestamp: Date.now(),
    environment: process.env.NODE_ENV || "development",
  });
});

// API routes
app.use("/api/agent", authenticateApiKey, agentRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

// Error handler
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════╗
║                                                          ║
║   BluePilot Agent API                                    ║
║                                                          ║
║   Server running on port ${PORT}                           ║
║   Environment: ${process.env.NODE_ENV || "development"}                      ║
║                                                          ║
║   Endpoints:                                             ║
║     POST /api/agent/simulate                             ║
║     POST /api/agent/execute                              ║
║     GET  /api/agent/policy                               ║
║     POST /api/agent/policy                               ║
║     GET  /api/agent/history                              ║
║     GET  /api/agent/balance                              ║
║     GET  /api/agent/health                               ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
  `);
});

export default app;
