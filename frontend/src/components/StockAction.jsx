import React, { useEffect, useState } from "react";
import axios from "axios";
import "./StockAction.css";
import Swal from "sweetalert2";
import "./alert.css";
const StockAction = ({ action, handler, symbol, currPrice, priceChange, pricePercentChange, onClose }) => {

    const BASE_URL = import.meta.env.VITE_BACKEND_LINK;
    const [quantity, setQuantity] = useState("");
    const [invalidOperation, setWarning] = useState(false);
    const [numberError, setNumberError] = useState("");
    axios.defaults.withCredentials = true;

    const toggleModel = () => {
        if (action === "BUY") {
            setQuantity("");
            handler("SELL");
        }
        else {
            setQuantity("");
            handler("BUY");
        }
    }

    const handleSubmit = async () => {
        if (!quantity || !Number.isInteger(Number(quantity))) {
            Swal.fire({
                toast: true,
                position: "top",
                icon: "error",
                title: "Please enter a valid integer quantity.",
                iconColor: "#ff4b4b",
                background: "#1a1a1a",
                showConfirmButton: false,
                timer: 3000,
                customClass: {
                    popup: "small-toast"
                }
            });
            // alert("Invalid quantity entered.");    
            return;
        }

        try {
            await axios.post(`${BASE_URL}/api/v1/dashBoard/addTransaction`, { symbol: symbol, quantity: Number(quantity), transaction_type: action }, { withCredentials: true });
            Swal.fire({
                toast: true,
                position: "top",
                icon: "success",
                title: `Transaction done of amount: ${(currPrice * quantity).toFixed(2)}`,
                iconColor: "#33ff57",
                background: "#1a1a1a",
                showConfirmButton: false,
                timer: 3000,
                customClass: {
                    popup: "small-toast"
                }
            });
            onClose();
            // alert(`Transaction done of amount: ${currPrice * quantity}`);
        } catch (err) {
            console.error("Error checking holding:", err);
            onClose();
        }
    };

    return (
        <div className="model-overlay">
            <div className="model-box"

                style={{
                    background: action === "BUY"
                        ? "linear-gradient(#002b12ff 14%, #0e0e0e 14%)"
                        : "linear-gradient(#310700ff 14%, #0e0e0e 14%)",

                }}

            >
                <h2>{action === "BUY" ? "Add to Portfolio" : "Remove from Portfolio"}</h2>

                <div className="model-name-toggle">
                    <div className="model-stock-symbol">{symbol}</div>
                    <div className="model-toggle-container">
                        <span className={`model-buy ${action === "BUY" ? "active-buy" : ""}`}
                            onClick={toggleModel}
                        >
                            Add
                        </span>
                        <span className={`model-sell ${action === "SELL" ? "active-sell" : ""}`}
                            onClick={toggleModel}
                        >
                            Rmv
                        </span>
                    </div>
                </div>


                <div className="model-price-info">
                    <div className="model-price">{currPrice}</div>
                    <div className="model-price-change"
                        data-testid="model-price-change"
                        style={{
                            color:
                                priceChange > 0
                                    ? "#00C853"
                                    : priceChange < 0
                                        ? "#c81b00ff"
                                        : "#FFF",
                        }}
                    >
                        {priceChange > 0 ? `+${priceChange}` : priceChange} (
                        {pricePercentChange > 0 ? `+${pricePercentChange}%` : `${pricePercentChange}%`})
                    </div>
                </div>

                <div className="model-tot-amount">
                    <label className="model-label">Total Amount</label>
                    <span className="model-calc">{Number.parseFloat(currPrice * quantity).toFixed(2)}</span>
                </div>

                <>
                    <label htmlFor="stock-quantity">Enter Quantity</label>
                    <div className="model-custom-input">
                        <input
                            type="number"
                            value={quantity}
                            min="1"
                            onKeyDown={(e) => {
                                if (["e", "E", "+", "-"].includes(e.key)) {
                                    e.preventDefault();
                                }
                            }}
                            onChange={(e) => setQuantity(e.target.value)}

                            style={{
                                caretColor: action === "BUY" ? "#00c853" : "#c81b00",
                                border: action === "BUY" ? "1px solid #00c853" : "1px solid #c81b00"
                            }}
                        />
                        <div className="controls">
                            <button onClick={() => setQuantity((prev) => Number(prev) + 1)}>▲</button>
                            <button onClick={() => setQuantity((prev) => Math.max(0, Number(prev) - 1))}>▼</button>
                        </div>
                    </div>
                    <button
                        className={`model-confirm-btn ${action === "BUY" ? "BUY" : "SELL"}`}
                        onClick={handleSubmit}
                    >
                        Confirm
                    </button>
                </>

                <button className="model-cancel-btn" onClick={onClose}>Cancel</button>

            </div>
        </div>
    );
};

export default StockAction;
