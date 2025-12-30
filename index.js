import path from "path";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./src/routes/auth.js";
import eventsRoutes from "./src/routes/events.js";
import bookingRoutes from "./src/routes/booking.js";
import { pool } from "./src/db.js";  // <-- VERY IMPORTANT


dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/events", eventsRoutes);
app.use("/api/booking", bookingRoutes);
// Serve static files from public folder
app.use("/public", express.static(path.join(process.cwd(), "public")));

app.get("/api/hello", (req, res) => {
  res.json({ msg: "Hello from server" });
});
// Test database connection
pool.connect()
  .then(() => console.log("Connected to PostgreSQL"))
  .catch((err) => console.error("Database connection failed:", err));


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});


