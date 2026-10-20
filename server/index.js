
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const salesRoutes = require("./routes/sales");

const app = express();

app.use(cors());
app.use(express.json({ limit: "20kb" }));

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Sales API
app.use("/api/sales", salesRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
