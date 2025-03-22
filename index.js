const cors = require("cors");
const dotenv = require("dotenv");
const express = require("express");
const multer = require("multer");
const app = express();
const PORT = process.env.PORT || 5000;
const corsOptions = {
  origin: [process.env.CLIENT_URL, "http://localhost:5173"], // Your frontend URL
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};
dotenv.config();
app.use(express.json());
app.use(cors(corsOptions));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

const upload = multer({ storage: multer.memoryStorage() });

const connectDB = require("./config/db");
connectDB();

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/users", require("./routes/userRoutes")(upload));
app.use("/api/trips", require("./routes/tripRoutes"));
app.use("/api/vehicles", require("./routes/vehicleRoutes")(upload));
