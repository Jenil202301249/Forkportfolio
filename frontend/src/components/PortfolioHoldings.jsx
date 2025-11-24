import './PortfolioHoldings.css';
import { useNavigate } from 'react-router-dom'; 

export const PortfolioHoldings = ({portfolioHoldings}) => {

    const navigate = useNavigate();

    return (
        <div className="holdings-table-wrapper">
            <table className="holdings-table">
                <thead>
                    <tr>
                        <th>Stock</th>
                        <th>Status</th>
                        <th>Shares</th>
                        <th>Last Price</th>
                        <th>AC/Share</th>
                        <th>Total Cost</th>
                        <th>Market Value</th>
                        <th>Day Gain UNRL</th>
                        <th>Day Gain UNRL (%)</th>
                        <th>Total Gain UNRL</th>
                        <th>Total Gain UNRL (%)</th>
                        <th>Realized Gain</th>
                    </tr>
                </thead>

                <tbody>
                    {portfolioHoldings?.map((item, idx) => (
                        <tr key={idx}>
                            <td onClick={() => navigate(`/stockdetails/${item.symbol}`)}>{item.symbol}</td>
                            <td>{item.status}</td>
                            <td>{item.shares}</td>
                            <td>{item.lastPrice}</td>
                            <td>{item.avgPrice}</td>
                            <td>{item.totalCost}</td>
                            <td>{item.marketValue}</td>
                            <td>{item.dayGainValue}</td>
                            <td>{item.dayGainPercent}</td>
                            <td>{item.totalGainValue}</td>
                            <td>{item.totalGainPercent}</td>
                            <td>{item.realizedGain}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};