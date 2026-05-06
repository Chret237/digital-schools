// index.js — Point d'entrée du serveur
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { createServer } = require("http");
const { Server } = require("socket.io");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./config/swagger");

const authRoutes = require("./routes/auth");
const projetRoutes = require("./routes/projets");
const tacheRoutes = require("./routes/taches");
const utilisateurRoutes = require("./routes/utilisateurs");
const invitationRoutes = require("./routes/invitations");
const { errorHandler, notFound } = require("./middleware/errorHandler");

const app = express();
const httpServer = createServer(app);

// ── Socket.IO (temps réel) ────────────────────────────────────────────────────
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log(`🔌 Client connecté : ${socket.id}`);

  socket.on("join_user", (userId) => {
    socket.join(`user_${userId}`);
  });

  socket.on("join_project", (projetId) => {
    socket.join(`project_${projetId}`);
    console.log(`👥 Socket ${socket.id} rejoint project_${projetId}`);
  });

  socket.on("leave_project", (projetId) => {
    socket.leave(`project_${projetId}`);
  });

  socket.on("disconnect", () => {
    console.log(`❌ Client déconnecté : ${socket.id}`);
  });
});

// Rendre io accessible dans les controllers
app.set("io", io);

// ── Sécurité ──────────────────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false })); // CSP désactivé pour Swagger UI
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  }),
);

// Rate limiting global
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200,
    message: { message: "Trop de requêtes. Réessayez dans 15 minutes." },
  }),
);

// Rate limiting strict pour l'auth
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: {
    message: "Trop de tentatives de connexion. Réessayez dans 15 minutes.",
  },
});

// ── Parsing ───────────────────────────────────────────────────────────────────
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ── Swagger UI ────────────────────────────────────────────────────────────────
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customSiteTitle: "Digital Solutions API",
    customCss: `
    .swagger-ui .topbar { background: #1e293b; }
    .swagger-ui .topbar-wrapper img { content: url(''); }
    .swagger-ui .info .title { color: #1e293b; }
  `,
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: "none",
      filter: true,
    },
  }),
);

// Endpoint pour télécharger le spec JSON
app.get("/api-docs.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/projets", projetRoutes);
app.use("/api/taches", tacheRoutes);
app.use("/api/utilisateurs", utilisateurRoutes);
app.use("/api/invitations", invitationRoutes);

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
  });
});

// ── Gestion des erreurs ───────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ── Démarrage ─────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`\n🚀 Serveur démarré sur http://localhost:${PORT}`);
  console.log(`📚 Documentation API : http://localhost:${PORT}/api-docs`);
  console.log(`🌍 Environnement : ${process.env.NODE_ENV || "development"}\n`);
});

module.exports = { app, io };
