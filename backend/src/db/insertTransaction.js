import { getPrice } from "../utils/getQuotes.js";
import { PriceStore } from "../utils/stores/priceRates.js";
import { sql } from "./dbConnection.js";
import YahooFinance from 'yahoo-finance2';
const yahooFinance = new YahooFinance();
    export const insertTransaction = async (email, symbol, quantity, transaction_type, time) => {
        try {
            if(transaction_type === "BUY"){
                quantity = Number(quantity);
                const holding_check = await sql`SELECT * FROM "stock_summary" WHERE email=${email} AND symbol=${symbol}`;
                if(!holding_check){
                    return {success:false,message:"Database error while checking holdings."};
                }
                if(holding_check.length>0){
                    const current_holding = Number(holding_check[0].current_holding);
                    const avg_price = Number(holding_check[0].avg_price);
                    const price = await getPrice(symbol);
                    if(!price.current){
                        return {success:false,message:"Unable to fetch stock price."};
                    }
                    const totalSpend = quantity * price.current;
                    const new_avg_price = ((avg_price * current_holding) + (price.current * quantity))/(current_holding + quantity);
                    const queries = [sql`INSERT INTO "user_transactions" (email, symbol, quantity, price, transaction_type, transaction_date) VALUES (${email}, ${symbol}, ${Math.abs(quantity)}, ${price.current}, ${transaction_type}, ${time})
                    RETURNING *;`,sql`UPDATE "stock_summary" SET current_holding = current_holding + ${quantity}, spended_amount = spended_amount + ${totalSpend}, avg_price = ${new_avg_price} WHERE email=${email} AND symbol=${symbol}`];
                    const [insert,update] = await sql.transaction(queries);
                    return {success:true,insert, update};
                }else{
                    let price;
                    const existingStock = await sql`SELECT * FROM "stocks" WHERE symbol=${symbol}`;
                    if(existingStock.length===0){
                        const quoteSummary = await yahooFinance.quoteSummary(symbol, {modules: ["assetProfile", "price"]});
                        if (!quoteSummary.price) {
                            return { success: false, message: "Unable to fetch stock details." };
                        }
                        const {
                            shortName,
                            longName,
                            exchange,
                            currency,
                            quoteType: type,
                            market: country,
                            regularMarketPrice,
                        } = quoteSummary.price;
                        const sector = quoteSummary.assetProfile?.sector ?? "N/A";
                        price = {
                            current:regularMarketPrice / PriceStore.get(currency)
                        };
                        await sql`
                            INSERT INTO "stocks" 
                            (symbol, short_name, long_name, sector, currency, type, country, exchange, created_at) 
                            VALUES (${symbol}, ${shortName}, ${longName}, ${sector}, ${currency}, ${type}, ${country}, ${exchange}, ${time}) 
                            RETURNING *;
                        `;
                    }
                    price = price || await getPrice(symbol);
                    if(!price.current){
                        return {success:false,message:"Unable to fetch stock price."};
                    }
                    const avg_Price = price.current;
                    const totalSpend = quantity * price.current;
                    const queries = [sql`INSERT INTO "user_transactions" (email, symbol, quantity, price, transaction_type, transaction_date) VALUES (${email}, ${symbol}, ${Math.abs(quantity)}, ${price.current}, ${transaction_type}, ${time})
                    RETURNING *;`,sql`INSERT INTO "stock_summary" (email, symbol, current_holding, spended_amount, avg_price)
                    VALUES (${email}, ${symbol}, ${quantity}, ${totalSpend}, ${avg_Price})`];
                    const [insert,update] = await sql.transaction(queries);
                    return {success:true,insert, update};
                }
            }else if(transaction_type === "SELL"){
                quantity = Number(quantity);
                const holding_check = await sql`SELECT spended_amount,current_holding,avg_price FROM "stock_summary" WHERE email=${email} AND symbol=${symbol}`;
                if(!holding_check){
                    return {success:false,message:"Database error while checking holdings."};
                }
                if(holding_check.length===0 || holding_check[0].current_holding<quantity){
                    return {success:false,message:"Insufficient holdings to sell."};
                }
                const current_holding = Number(holding_check[0].current_holding);
                const avg_price = Number(holding_check[0].avg_price);
                const price = await getPrice(symbol);
                if(!price.current){
                    return {success:false,message:"Unable to fetch stock price."};
                }
                const totalSpend = price.current * quantity;
                const profit = (price.current - avg_price) * quantity;
                let new_avg_price = (avg_price * current_holding - totalSpend)/(current_holding - quantity);
                if(Number.isNaN(new_avg_price)||(current_holding === quantity)) new_avg_price = 0;
                const queries = [sql`INSERT INTO "user_transactions" (email, symbol, quantity, price, transaction_type, transaction_date) VALUES (${email}, ${symbol}, ${Math.abs(quantity)}, ${price.current}, ${transaction_type}, ${time})
                RETURNING *;`,sql`UPDATE "stock_summary" SET current_holding = current_holding - ${quantity}, spended_amount = spended_amount - ${totalSpend}, avg_price = ${new_avg_price}, realized_gain = realized_gain + ${profit} WHERE email=${email} AND symbol=${symbol}`];
                const [insert,update] = await sql.transaction(queries);
                return {success:true,insert, update};
            }else{
                return {success:false,message:"Invalid transaction type."};
            }
        } catch (error) {
            console.error('Error inserting transaction:', error);
            return null;
        }
    };