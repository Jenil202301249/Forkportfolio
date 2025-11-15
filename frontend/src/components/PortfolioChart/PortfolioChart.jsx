import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";
import "./PortfolioChart.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function PortfolioChart() {
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [
      {
        label: "Portfolio Value ($)",
        data: [],
        borderColor: "#22C55E",
        backgroundColor: "rgba(34, 197, 94, 0.1)",
        tension: 0.4,
        fill: false,
      },
    ],
  });
  const [hiddenDates, setHiddenDates] = useState([]);

  const [range, setRange] = useState("30d");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  axios.defaults.withCredentials = true;

  const BACKEND_URL = import.meta.env.VITE_BACKEND_LINK;
  const VALUATION_API = `${BACKEND_URL}/api/v1/dashboard/userPortfolioValuation`;

  // Dynamic Chart.js Options Based on Range
  const options = useMemo(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
          labels: { color: "#FFFFFF" },
        },
        title: {
          display: true,
          text: "Portfolio Performance",
          color: "#00C853",
          font: { size: 22, weight: "bold" },
        },
        tooltip: {
          enabled: true,
          backgroundColor: "#09090B",
          borderColor: "#00C853",
          borderWidth: 1,
          titleColor: "#F4F4F5",
          bodyColor: "#A1A1AA",
          padding: 10,
          cornerRadius: 4,

          parser: () => {},//✅VERY IMPORTANT FIX

          callbacks: {
            title: (context) => {
              const index = context[0].dataIndex;
              const iso = hiddenDates[index];
              const d = new Date(iso);

              return d.toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              });
            },
            label: (context) => {
              let label = context.dataset.label || "";
              if (label) label += ": ";
              if (context.parsed.y !== null)
                label += `$${context.parsed.y.toLocaleString()}`;
              return label;
            },
          },
        },
      },
      interaction: { mode: "index", intersect: false },
      elements: {
        point: { radius: 0, hoverRadius: 6, hoverBackgroundColor: "#22C55E" },
      },
      scales: {
        x: {
          type: "category", //✅FIX:prevents all date parsing
          ticks: {
            color: "#FFFFFF",
            autoSkip: false,
            maxRotation: 60,
            minRotation: 40,
            font: (context) => {
              const label = context.tick.label;
              return { weight: label ? "bold" : "normal" };
            },
          },
          grid: {
            display: true,
            color: (context) => {
              if (range === "30d") return "rgba(0,0,0,0)";
              const label = context.tick.label;
              return label ? "#3F3F46" : "rgba(0,0,0,0)";
            },
            lineWidth: (context) => {
              const label = context.tick.label;
              return label ? 1.2 : 0;
            },
          },
        },
        y: {
          ticks: {
            color: "#A1A1AA",
            callback: (v) => v.toLocaleString(),
          },
          grid: { color: "#3F3F46" },
        },
      },
    };
  }, [range, hiddenDates]); //✅keep tooltip in sync with real dates

  const fetchPortfolioData = async () => {
    try {
      setError("");
      setLoading(true);

      const response = await axios.get(VALUATION_API);
      const { data } = response.data || {};
      if (!data?.daily) throw new Error("Backend data missing.");

      const daily = data.daily;

      let labels = [];
      let values = [];

      if (range === "30d") {
        const sliced = daily.slice(-30);

        labels = sliced.map((d) => {
          const date = new Date(d.date);
          return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }); //"Nov 30"
        });
        setHiddenDates(sliced.map((d) => d.date));

        values = sliced.map((d) => d.valuation);
      }

      else if (range === "6m") {
        const sliced = daily.slice(-182);

        labels = sliced.map((d) => {
          const date = new Date(d.date);
          return date.getDate() === 1
            ? date.toLocaleDateString("en-US", { month: "short" })
            : "";
        });
        setHiddenDates(sliced.map((d) => d.date));

        values = sliced.map((d) => d.valuation);
      }

      else if (range === "1y") {
        const sliced = daily.slice(-365);

        labels = sliced.map((d) => {
          const date = new Date(d.date);
          return date.getDate() === 1
            ? date.toLocaleDateString("en-US", { month: "short" })
            : "";
        });
        setHiddenDates(sliced.map((d) => d.date));

        values = sliced.map((d) => d.valuation);
      }

      setChartData({
        labels,
        datasets: [
          {
            label: "Portfolio Value ($)",
            data: values,
            borderColor: "#22C55E",
            backgroundColor: "rgba(34, 197, 94, 0.1)",
            tension: 0.4,
            fill: false,
            pointHoverRadius: 6,
            pointHoverBorderWidth: 2,
          },
        ],
      });
    } catch (err) {
      console.error("Error fetching valuation data:", err);
      setError(
        err.response?.status === 401
          ? "Session expired. Please log in again."
          : "Failed to fetch portfolio performance data."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortfolioData();
  }, [range]);

  if (loading)
    return (
      <div className="portfoliochart-container">
        <div className="portfoliochart-loading">Loading Portfolio Data...</div>
      </div>
    );

  if (error)
    return (
      <div className="portfoliochart-container">
        <div className="portfoliochart-error">{error}</div>
      </div>
    );

  return (
    <div className="portfoliochart-container">
      <div className="portfoliochart-box">
        <div className="portfoliochart-buttons">
          {[
            { label: "30D", value: "30d" },
            { label: "6M", value: "6m" },
            { label: "1Y", value: "1y" },
          ].map((btn) => (
            <button
              key={btn.value}
              onClick={() => setRange(btn.value)}
              className={`portfoliochart-btn ${
                range === btn.value ? "active" : ""
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>

        <div className="portfoliochart-graph">
          <Line options={options} data={chartData} />
        </div>
      </div>
    </div>
  );
}
