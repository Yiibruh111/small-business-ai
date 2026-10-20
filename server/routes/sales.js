const express = require("express");
const { randomUUID } = require("crypto");

const router = express.Router();

const sales = [];

// GET /api/sales?date=2026-10-20
// Retrieve all sales, or filter by date.
router.get("/", (req, res) => {
  const { date } = req.query;

  const result = date
    ? sales.filter((sale) => sale.date === date)
    : sales;

  res.json(result);
});


router.post("/", (req, res) => {
  const { productName, quantity, unitPrice, date } = req.body;

  if (
    typeof productName !== "string" ||
    productName.trim().length === 0 ||
    productName.trim().length > 150
  ) {
    return res.status(400).json({
      error: "Product name is required."
    });
  }

  if (
    !Number.isSafeInteger(quantity) ||
    quantity <= 0 ||
    !Number.isFinite(unitPrice) ||
    unitPrice < 0 ||
    unitPrice > 100000000
  ) {
    return res.status(400).json({
      error: "Enter a valid quantity and unit price."
    });
  }

  if (
    typeof date !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    new Date(`${date}T00:00:00.000Z`).toISOString().slice(0, 10) !== date
  ) {
    return res.status(400).json({
      error: "Enter a valid date in YYYY-MM-DD format."
    });
  }

  const priceInCents = Math.round(unitPrice * 100);

  if (!Number.isSafeInteger(priceInCents)) {
    return res.status(400).json({
      error: "Unit price is too large."
    });
  }

  const totalInCents = priceInCents * quantity;

  if (!Number.isSafeInteger(totalInCents)) {
    return res.status(400).json({
      error: "Sale total is too large."
    });
  }

  const sale = {
    id: randomUUID(),
    productName: productName.trim(),
    quantity,
    unitPrice: priceInCents / 100,
    total: totalInCents / 100,
    date,
    createdAt: new Date().toISOString()
  };

  sales.push(sale);

  res.status(201).json(sale);
});

// DELETE /api/sales/:id
// Delete an incorrect sale.
router.delete("/:id", (req, res) => {
  const index = sales.findIndex(
    (sale) => sale.id === req.params.id
  );

  if (index === -1) {
    return res.status(404).json({
      error: "Sale not found."
    });
  }

  sales.splice(index, 1);

  res.json({ message: "Sale deleted successfully." });
});

module.exports = router;
