import { getPrice } from "../utils/getQuotes.js";
import { sql } from "./dbConnection.js";
import YahooFinance from 'yahoo-finance2';
const yahooFinance = new YahooFinance();
    export const insertTransaction = async (email, symbol, quantity, transaction_type, time) => {
        try {
            let price = undefined
            const holding_check = await sql`SELECT spended_amount,current_holding FROM "stock_summary" WHERE email=${email} AND symbol=${symbol}`;
            if(holding_check.length===0){
                holding_check[0]={current_holding:0,spended_amount:0};
            }
            let old_holding = 0, old_spended_amount = 0;
            if(transaction_type==='SELL'){                    
                if(holding_check[0].current_holding<quantity){  
                    return {success:false,message:"Insufficient holdings to sell."};
                } 
            }
            old_holding = Number(holding_check[0].current_holding);
            old_spended_amount = Number(holding_check[0].spended_amount);
            if(transaction_type==='BUY'){
                const check = await sql`SELECT * FROM "stocks" WHERE symbol=${symbol}`;
                if(check.length===0){
                    const quoteSummary = await yahooFinance.quoteSummary(symbol, { modules: ['assetProfile', 'price'] });
                    //console.log(quoteSummary)
                    if(!quoteSummary.price){
                        //console.log('No data found for symbol:', symbol);   
                        return {success:false,message:"Unable to fetch stock details."};
                    }
                    const {
                    shortName,
                    longName,
                    exchange,
                    currency,
                    quoteType: type,
                    market: country,
                    } = quoteSummary.price;
                    const { sector } = quoteSummary.assetProfile||"N/A";
                    price = {current: quoteSummary.regularMarketPrice};
                    await sql`INSERT INTO "stocks" (symbol,short_name,long_name,sector,currency,type,country,exchange,created_at) VALUES (${symbol},${shortName},${longName},${sector},${currency},${type},${country},${exchange},${time}) RETURNING *;`;
                }
            }
            if(!price) price = await getPrice(symbol);
            price = price.current;
            let multiplier = 1;
            if(transaction_type==='SELL'){
                quantity = -quantity;
                multiplier = 0;
            }
            const totalSpend = price * quantity;
            let new_avg_price = (old_spended_amount + (multiplier*totalSpend)) / (old_holding + (multiplier*quantity));
            const queries = [sql`
                INSERT INTO "user_transactions" (email, symbol, quantity, price, transaction_type, transaction_date) VALUES (${email}, ${symbol}, ${Math.abs(quantity)}, ${price}, ${transaction_type}, ${time})
                RETURNING *;
                `,
                sql`
                    INSERT INTO "stock_summary" (email, symbol, current_holding, spended_amount, Avg_Price)
                    VALUES (${email}, ${symbol}, ${quantity}, ${totalSpend}, ${new_avg_price})
                    ON CONFLICT (email, symbol)
                    DO UPDATE SET
                        current_holding = "stock_summary".current_holding + ${quantity},
                        spended_amount = "stock_summary".spended_amount + ${totalSpend},
                        avg_price = ${new_avg_price}
                        WHERE "stock_summary".email=${email} AND "stock_summary".symbol=${symbol}
                    RETURNING symbol, current_holding, yestarday_holding, spended_amount;
            `];
            const [insert,update] = await sql.transaction(queries);
            return {success:true,insert, update};
        } catch (error) {
            console.log('Error inserting transaction:', error);
            return null;
        }
    };