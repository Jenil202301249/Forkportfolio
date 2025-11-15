import YahooFinance from 'yahoo-finance2';
const yahooFinance = new YahooFinance()

const formatValue = (value, unit = '') => {
    if (typeof value === 'number') {
        return `${value.toFixed(2)}${unit}`;
    }
    return value; 
};

export const stockDetails = async (req, res) => {
    const { ticker } = req.query; 

    if (!ticker) {
        return res.status(400).json({ success: false, message: 'Stock ticker is required.' });
    }
    console.log(ticker);
    const modules = [
        'price', 'summaryDetail', 'defaultKeyStatistics', 'financialData', 'balanceSheetHistoryQuarterly','assetProfile'
    ];

    try {
        const results = await yahooFinance.quoteSummary(ticker, { modules });

        const stockData = {
            priceInfo: {
                currentPrice: results.price.regularMarketPrice,
                previousClose: results.price.regularMarketPreviousClose,
                dayLow: results.summaryDetail.dayLow,
                dayHigh: results.summaryDetail.dayHigh,
                volume: results.price.regularMarketVolume,
                marketCap: results.price.marketCap,
                change: results.price.regularMarketChange,
                changePercentage: results.price.regularMarketChangePercent,
                open: results.price.regularMarketOpen,
                fiftytwoWeekchange: results.defaultKeyStatistics['52WeekChange'],
                fiftytwoWeekHigh : results.summaryDetail.fiftyTwoWeekHigh,
                fiftyTwoWeekLow : results.summaryDetail.fiftyTwoWeekLow,
            },

            fundamentals: {
                roceTTM: results.financialData.returnOnAssets, 
                roeTTM: results.financialData.returnOnEquity,
                peRatioTTM: results.summaryDetail.trailingPE,
                epsTTM: results.defaultKeyStatistics.trailingEps,
                pbRatio: results.summaryDetail.priceToBook,
                dividendYield: results.summaryDetail.dividendYield,
                beta : results.defaultKeyStatistics.beta,
                bookValue: results.defaultKeyStatistics.bookValue,
                debtToEquity: results.financialData.debtToEquity,
            },

            // Financial Statements (TTM/MRQ data)
            financials: {
                // Income Statement
                revenueTTM: results.financialData.totalRevenue,
                revenuePerShare: results.financialData.revenuePerShare,
                grossProfitTTM: results.financialData.grossProfits,
                ebitda: results.financialData.ebitda,
                netIncome: results.financialData.netIncomeToShareholders,
                dilutedEPS: results.defaultKeyStatistics.dilutedEps,
                earningGrowthQuater: results.defaultKeyStatistics.earningsQuarterlyGrowth,

            },
            balenceSheet:{
                // Balance Sheet (MRQ) - Accessing the latest quarterly statement [0]
                totalCash: results.financialData.totalCash,
                totalCashPerShare: results.financialData.totalCashPerShare,
                totalDebt: results.financialData.totalDebt,
                deptToEquity: results.financialData.debtToEquity,
                currentRatioMRQ: results.financialData.currentRatio,
                bookValuePerShare: (results.defaultKeyStatistics.bookValue) / (results.defaultKeyStatistics.sharesOutstanding) || "--",
            },
            profitability:{
                // Profitability
                profitMargin: results.financialData.profitMargins,
                operatingMargin: results.financialData.operatingMargins,
                returnOnAssets: results.financialData.returnOnAssets,
                returnOnEquity: results.financialData.returnOnEquity,
            },
            cashFlow:{
                operatingCashFlow: results.financialData.operatingCashFlow || "--" ,
                freeCashFlow: results.financialData.freeCashFlow || "--",
            },
            fiscalInformation:{
                fiscalYearEnd : results.defaultKeyStatistics.nextFiscalYearEnd,
                MRQ: results.defaultKeyStatistics.mostRecentQuarter,
            },
            Company:{
                longname: results.price.longName||"--",
                shortname: results.price.shortName||"--",
                description: results.assetProfile.description||"--",
                longdescription: results.assetProfile.longBusinessSummary||"--",
                fulltimeemployees: results.assetProfile.fullTimeEmployees||0,
                sector: results.assetProfile.sector||"--",
                industry: results.assetProfile.industry||"--",
                website: results.assetProfile.website||"--"
            }
        };

        
        // // ROE
        if (stockData.fundamentals.roeTTM !== undefined && stockData.fundamentals.roeTTM !== null) {
            stockData.fundamentals.roeTTM = formatValue(stockData.fundamentals.roeTTM * 100, '%');
        }
        // Dividend Yield
        if (stockData.fundamentals.dividendYield !== undefined && stockData.fundamentals.dividendYield !== null) {
            stockData.fundamentals.dividendYield = formatValue(stockData.fundamentals.dividendYield * 100, '%');
        }
        // Profit Margin
        if (stockData.financials.profitMargin !== undefined && stockData.financials.profitMargin !== null) {
            stockData.financials.profitMargin = formatValue(stockData.financials.profitMargin * 100, '%');
        }
        // Operating Margin
        if (stockData.financials.operatingMargin !== undefined && stockData.financials.operatingMargin !== null) {
            stockData.financials.operatingMargins = formatValue(stockData.financials.operatingMargin * 100, '%');
        }

        
        return res.status(200).json({ success: true, data: stockData });

    } catch (error) {
        console.error(`Error fetching or processing data for ${ticker}:`, error);
        return res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch or process stock details. Data may be missing or the ticker is invalid.', 
            error: error.message 
        });
    }
};