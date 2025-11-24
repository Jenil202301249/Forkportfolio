import axios from 'axios'
async function fetchRates() {
    try {
        const data = await axios.get(process.env.RATE_EXCHANGE);
        return data.data.rates
    } catch (error) {
        console.error('Error:', error.message);
    }
}
const createPriceStore = async () => {
    const cache = {};
    const rates = await fetchRates();
    cache['INR'] = {...rates,expiresAt:Date.now()+60*60*1000};
    const cleanupprice = async () => {
        if(!cache['INR']) return;
        const now = Date.now();
        if (cache['INR'].expiresAt < now) {
            delete cache['INR'];
            console.log(`Cleaned up price exchange for: INR`);
            const rates = await fetchRates();
            cache['INR'] = {...rates,expiresAt:Date.now()+60*60*1000};
        }
    };
    setInterval(cleanupprice, 60*60*1000);
    return {
        get: (currency) => {
            return cache['INR'][currency];
        }
    };
};

export const PriceStore = await createPriceStore();