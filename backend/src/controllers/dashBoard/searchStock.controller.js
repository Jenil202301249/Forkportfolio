import YahooFinance from "yahoo-finance2";
const yahooFinance = new YahooFinance();
import Fuse from "fuse.js";
const stocks = [
  { "symbol": "TCS.NS", "shortname": "TCS", "longname": "Tata Consultancy Services Ltd" },
  { "symbol": "INFY.NS", "shortname": "Infosys", "longname": "Infosys Ltd" },
  { "symbol": "RELIANCE.NS", "shortname": "Reliance", "longname": "Reliance Industries Ltd" },
  { "symbol": "TATAMOTORS.NS", "shortname": "Tata Motors", "longname": "Tata Motors Ltd" },
  { "symbol": "TATASTEEL.NS", "shortname": "Tata Steel", "longname": "Tata Steel Ltd" },
  { "symbol": "HDFCBANK.NS", "shortname": "HDFC Bank", "longname": "HDFC Bank Ltd" },
  { "symbol": "ICICIBANK.NS", "shortname": "ICICI Bank", "longname": "ICICI Bank Ltd" },
  { "symbol": "SBIN.NS", "shortname": "SBI", "longname": "State Bank of India" },
  { "symbol": "WIPRO.NS", "shortname": "Wipro", "longname": "Wipro Ltd" },
  { "symbol": "TECHM.NS", "shortname": "Tech Mahindra", "longname": "Tech Mahindra Ltd" },
  { "symbol": "HINDUNILVR.NS", "shortname": "HUL", "longname": "Hindustan Unilever Ltd" },
  { "symbol": "AXISBANK.NS", "shortname": "Axis Bank", "longname": "Axis Bank Ltd" },
  { "symbol": "KOTAKBANK.NS", "shortname": "Kotak Bank", "longname": "Kotak Mahindra Bank Ltd" },
  { "symbol": "ITC.NS", "shortname": "ITC", "longname": "ITC Ltd" },
  { "symbol": "HCLTECH.NS", "shortname": "HCL Tech", "longname": "HCL Technologies Ltd" },
  { "symbol": "BAJFINANCE.NS", "shortname": "Bajaj Finance", "longname": "Bajaj Finance Ltd" },
  { "symbol": "ASIANPAINT.NS", "shortname": "Asian Paints", "longname": "Asian Paints Ltd" },
  { "symbol": "LT.NS", "shortname": "L&T", "longname": "Larsen & Toubro Ltd" },
  { "symbol": "ULTRACEMCO.NS", "shortname": "UltraTech", "longname": "UltraTech Cement Ltd" },
  { "symbol": "SUNPHARMA.NS", "shortname": "Sun Pharma", "longname": "Sun Pharmaceutical Industries Ltd" },
  { "symbol": "ONGC.NS", "shortname": "ONGC", "longname": "Oil & Natural Gas Corporation Ltd" },
  { "symbol": "BHARTIARTL.NS", "shortname": "Airtel", "longname": "Bharti Airtel Ltd" },
  { "symbol": "BAJAJFINSV.NS", "shortname": "Bajaj Finserv", "longname": "Bajaj Finserv Ltd" },
  { "symbol": "POWERGRID.NS", "shortname": "Power Grid", "longname": "Power Grid Corporation Ltd" },
  { "symbol": "ADANIENT.NS", "shortname": "Adani Ent", "longname": "Adani Enterprises Ltd" },
  { "symbol": "ADANIGREEN.NS", "shortname": "Adani Green", "longname": "Adani Green Energy Ltd" },
  { "symbol": "ADANIPORTS.NS", "shortname": "Adani Ports", "longname": "Adani Ports & SEZ Ltd" },
  { "symbol": "HDFCLIFE.NS", "shortname": "HDFC Life", "longname": "HDFC Life Insurance Co Ltd" },
  { "symbol": "SBILIFE.NS", "shortname": "SBI Life", "longname": "SBI Life Insurance Co Ltd" },
  { "symbol": "BRITANNIA.NS", "shortname": "Britannia", "longname": "Britannia Industries Ltd" },
  { "symbol": "TITAN.NS", "shortname": "Titan", "longname": "Titan Company Ltd" },
  { "symbol": "NESTLEIND.NS", "shortname": "Nestle", "longname": "Nestle India Ltd" },
  { "symbol": "COALINDIA.NS", "shortname": "Coal India", "longname": "Coal India Ltd" },
  { "symbol": "MARUTI.NS", "shortname": "Maruti", "longname": "Maruti Suzuki India Ltd" },
  { "symbol": "HINDALCO.NS", "shortname": "Hindalco", "longname": "Hindalco Industries Ltd" },
  { "symbol": "EICHERMOT.NS", "shortname": "Eicher", "longname": "Eicher Motors Ltd" },
  { "symbol": "BAJAJ-AUTO.NS", "shortname": "Bajaj Auto", "longname": "Bajaj Auto Ltd" },
  { "symbol": "HEROMOTOCO.NS", "shortname": "Hero MotoCorp", "longname": "Hero MotoCorp Ltd" },
  { "symbol": "NTPC.NS", "shortname": "NTPC", "longname": "NTPC Ltd" },
  { "symbol": "DRREDDY.NS", "shortname": "Dr Reddy’s", "longname": "Dr. Reddy’s Laboratories Ltd" },
  { "symbol": "DIVISLAB.NS", "shortname": "Divis Labs", "longname": "Divi’s Laboratories Ltd" },
  { "symbol": "GRASIM.NS", "shortname": "Grasim", "longname": "Grasim Industries Ltd" },
  { "symbol": "TATACONSUM.NS", "shortname": "Tata Consumer", "longname": "Tata Consumer Products Ltd" },
  { "symbol": "UPL.NS", "shortname": "UPL", "longname": "UPL Ltd" },
  { "symbol": "BPCL.NS", "shortname": "BPCL", "longname": "Bharat Petroleum Corporation Ltd" },
  { "symbol": "IOC.NS", "shortname": "IOC", "longname": "Indian Oil Corporation Ltd" },
  { "symbol": "SHREECEM.NS", "shortname": "Shree Cement", "longname": "Shree Cement Ltd" },
  { "symbol": "APOLLOHOSP.NS", "shortname": "Apollo Hospitals", "longname": "Apollo Hospitals Enterprise Ltd" },
  { "symbol": "CIPLA.NS", "shortname": "Cipla", "longname": "Cipla Ltd" }
]
const fuse = new Fuse(stocks, {
  keys: ["symbol", "shortname", "longname"],
  threshold: 0.2,
});

export const searchStock = async (req,res)=>{
    const {ticker} = req.query;
    if(!ticker || ticker.length<1){
        return res.status(400).json({success:false,message:"Query is required"})
    }
    try{
        let localsuggestions = fuse.search(ticker, { limit: 10 });
        localsuggestions = localsuggestions.map(r => r.item);
        let result = await yahooFinance.search(ticker,{enableFuzzyQuery: true,quotesCount: 10,region: 'INDIA',enableEnhancedTrivialQuery: true});
        if(!result||!result.quotes||result.quotes.length===0){
            if(!localsuggestions||localsuggestions.length===0){
                return res.status(404).json({success:false,message:"Stock not found"})
            }
            return res.status(200).json({success:true,suggestions: localsuggestions});
        }

        const yahoosuggestions = result.quotes.filter(stock => stock.symbol).map((stock) => {
            return {
                symbol: stock.symbol,
                longname: stock.longname,
                shortname: stock.shortname,
            }
        });
        const merged = [...localsuggestions,...yahoosuggestions];
        const suggestions = Array.from(
  new Map(merged.map(stock => [stock.symbol, stock])).values()
);
        return res.status(200).json({success:true,suggestions: suggestions});
    }catch(error){
        console.error('Stock search error:',error);
        return res.status(500).json({success:false,message:"Internal server error"})
    }
}

