const createStockPriceStore = () => {
    const cache = {};
    const cleanupStocks = () => {
        const now = Date.now();
        for (const symbol in cache) {
            if (cache[symbol].expiresAt < now) {
                delete cache[symbol];
                console.log(`Cleaned up stock data for: ${symbol}`);
            }
        }
    };
    setInterval(cleanupStocks, 60*1000);
    return {
        add: (symbol, data) => {
            cache[symbol] = data;
        },
        get: (symbol) => {
            return cache[symbol];
        }
    };
};

export const stockPriceStore = createStockPriceStore();