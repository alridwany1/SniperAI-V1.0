import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import apiRoutes from "./src/backend/routes/index.js";
import { errorHandler } from "./src/backend/middlewares/errorHandler.middleware.js";
import { securityMiddlewares } from './src/backend/middlewares/security.middleware.js';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './src/backend/config/swagger.config.js';

dotenv.config();

const app = express();
const PORT = 3000;

app.set('trust proxy', 1);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use(securityMiddlewares);

app.use("/api", apiRoutes);

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Catch-all for unmatched /api routes to prevent falling through to HTML SPA fallback
app.use("/api/*", (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.status(404).json({ success: false, error: `API route not found: ${req.method} ${req.originalUrl}` });
});

app.use(errorHandler);

export async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        allowedHosts: true,
        cors: true,
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite dev middleware attached.");
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log("Production static files mounted.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
