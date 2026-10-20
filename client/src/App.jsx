
import { useCallback, useEffect, useState } from "react";
import "./index.css";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:3000"
).replace(/\/$/, "");

function todayString() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatRM(value) {
  return new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency: "MYR"
  }).format(value);
}

function App() {
  const [date, setDate] = useState(todayString());
  const [sales, setSales] = useState([]);
  const [productName, setProductName] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unitPrice, setUnitPrice] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadSales = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/api/sales?date=${encodeURIComponent(date)}`
      );

      if (!response.ok) {
        throw new Error("Unable to retrieve sales.");
      }

      const data = await response.json();
      setSales(data);
    } catch (err) {
      setError(
        "Cannot connect to the backend. Check that the server is running."
      );
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    loadSales();
  }, [loadSales]);

  const dailyRevenue = sales.reduce(
    (sum, sale) => sum + Math.round(sale.total * 100),
    0
  ) / 100;

  const totalTransactions = sales.length;

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setMessage("");

    const parsedQuantity = Number(quantity);
    const parsedPrice = Number(unitPrice);

    if (
      !productName.trim() ||
      !Number.isSafeInteger(parsedQuantity) ||
      parsedQuantity <= 0 ||
      unitPrice.trim() === "" ||
      !Number.isFinite(parsedPrice) ||
      parsedPrice < 0 ||
      parsedPrice > 100000000
    ) {
      setError("Enter a product name, valid quantity and valid price.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(`${API_URL}/api/sales`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          productName: productName.trim(),
          quantity: parsedQuantity,
          unitPrice: parsedPrice,
          date
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to save sale.");
      }

      setProductName("");
      setQuantity("1");
      setUnitPrice("");
      setMessage("Sale recorded successfully.");

      await loadSales();
    } catch (err) {
      setError(err.message || "Unable to save sale.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this sale?"
    );

    if (!confirmed) return;

    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `${API_URL}/api/sales/${encodeURIComponent(id)}`,
        { method: "DELETE" }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to delete sale.");
      }

      setMessage("Sale deleted.");
      await loadSales();
    } catch (err) {
      setError(err.message || "Unable to delete sale.");
    }
  }

  function exportCSV() {
    const escapeCSV = (value) =>
      `"${String(value).replace(/"/g, '""')}"`;

    const rows = [
      ["Date", "Product", "Quantity", "Unit Price (RM)", "Total (RM)"],
      ...sales.map((sale) => [
        sale.date,
        sale.productName,
        sale.quantity,
        sale.unitPrice.toFixed(2),
        sale.total.toFixed(2)
      ])
    ];

    const csv = rows
      .map((row) => row.map(escapeCSV).join(","))
      .join("\r\n");

    // BOM helps spreadsheet applications read UTF-8 correctly.
    const blob = new Blob(["\uFEFF", csv], {
      type: "text/csv;charset=utf-8;"
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `sales-${date}.csv`;
    link.click();

    URL.revokeObjectURL(url);
  }

  return (
    <main className="app">
      <header className="page-header">
        <div>
          <p className="eyebrow">SMALL BUSINESS FINANCE</p>
          <h1>Daily Sales Tracker</h1>
          <p className="subtitle">
            Record sales, monitor revenue and export your daily report.
          </p>
        </div>
      </header>

      <section className="date-panel">
        <label htmlFor="sales-date">Report date</label>
        <input
          id="sales-date"
          type="date"
          value={date}
          onChange={(event) => {
            setDate(event.target.value);
            setMessage("");
            setError("");
          }}
        />
      </section>

      <section className="summary-grid">
        <article className="summary-card">
          <span>Daily revenue</span>
          <h2>{formatRM(dailyRevenue)}</h2>
        </article>

        <article className="summary-card">
          <span>Transactions</span>
          <h2>{totalTransactions}</h2>
        </article>
      </section>

      <section className="panel">
        <h2>Record a sale</h2>

        <form onSubmit={handleSubmit} className="sales-form">
          <div className="form-field">
            <label htmlFor="product">Product name</label>
            <input
              id="product"
              value={productName}
              onChange={(event) => setProductName(event.target.value)}
              placeholder="e.g. Coffee Pack"
              maxLength={150}
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="quantity">Quantity</label>
            <input
              id="quantity"
              type="number"
              min="1"
              step="1"
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="price">Unit price (RM)</label>
            <input
              id="price"
              type="number"
              min="0"
              max="100000000"
              step="0.01"
              value={unitPrice}
              onChange={(event) => setUnitPrice(event.target.value)}
              placeholder="15.00"
              required
            />
          </div>

          <button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Add sale"}
          </button>
        </form>

        {error && <p className="notice error">{error}</p>}
        {message && <p className="notice success">{message}</p>}
      </section>

      <section className="panel">
        <div className="table-heading">
          <div>
            <h2>Sales transactions</h2>
            <p className="subtitle">
              Showing sales for {date}
            </p>
          </div>

          <button
            type="button"
            className="secondary-button"
            onClick={exportCSV}
            disabled={sales.length === 0}
          >
            Export CSV
          </button>
        </div>

        {loading ? (
          <p>Loading sales...</p>
        ) : sales.length === 0 ? (
          <p className="empty-state">
            No sales recorded for this date yet.
          </p>
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Quantity</th>
                  <th>Unit price</th>
                  <th>Total</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {sales.map((sale) => (
                  <tr key={sale.id}>
                    <td>{sale.productName}</td>
                    <td>{sale.quantity}</td>
                    <td>{formatRM(sale.unitPrice)}</td>
                    <td>{formatRM(sale.total)}</td>
                    <td>
                      <button
                        type="button"
                        className="delete-button"
                        onClick={() => handleDelete(sale.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>

              <tfoot>
                <tr>
                  <td colSpan="3">Total revenue</td>
                  <td colSpan="2">{formatRM(dailyRevenue)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </section>

      <footer>
        <p>Sales Assistant · Prototype version</p>
        <p>Financial totals are calculated by the application.</p>
      </footer>
    </main>
  );
}

export default App;
