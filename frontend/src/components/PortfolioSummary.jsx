import './PortfolioSummary.css';
import { useNavigate } from 'react-router-dom';

export const PortfolioSummary = ({portfolioSummary}) => {

    const navigate = useNavigate();

    return (
        <div className="summary-table-wrapper">
            <table className="summary-table">
                <thead>
                    <tr>
                        <th>Stock</th>
                        <th>Last Price</th>
                        <th>Change (%)</th>
                        <th>Change</th>
                        <th>Currency</th>
                        <th>Market Time</th>
                        <th>Volume</th>
                        <th>Shares</th>
                        <th>Day Range</th>
                        <th>52W Range</th>
                        <th>Market Cap</th>
                    </tr>
                </thead>

                <tbody>
                    {portfolioSummary?.map((item, idx) => (
                        <tr key={idx}>
                            <td onClick={() => navigate(`/stockdetails/${item.symbol}`)}>{item.symbol}</td>
                            <td>{item.lastPrice}</td>
                            <td
                                className={
                                    Number(item.changePercent) < 0
                                        ? "negative"
                                        : "positive"
                                }
                            >
                                {item.changePercent}%
                            </td>
                            <td
                                className={
                                    Number(item.change) < 0
                                        ? "negative"
                                        : "positive"
                                }
                            >
                                {item.change}
                            </td>
                            <td>{item.currency}</td>
                            <td>{item.marketTime}</td>
                            <td>{item.volume}</td>
                            <td>{item.shares}</td>
                            <td className="range">{item.dayRange}</td>
                            <td className="range">{item.yearRange}</td>

                            <td>{item.marketCap}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};