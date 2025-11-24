import { insertTransaction } from "../../db/insertTransaction.js";
import { addActivityHistory } from "../../mongoModels/user.model.js";


export const addTransaction = async (req, res) => {
    let { symbol, quantity,transaction_type } = req.body;
    const email = req.user.email;
    if (!email || !symbol || (!quantity&&quantity!==0)|| !transaction_type) {
        console.log(req.body,req.user);
        return res.status(400).json({ success: false, message: "All fields are required" });
    }
    transaction_type = transaction_type.toUpperCase();
    let check_transaction_type = ['BUY','SELL'];
    if(!check_transaction_type.includes(transaction_type)){
        return res.status(400).json({success:false,message:"Invalid transaction type."});
    } 
    if(typeof quantity !== 'number' || Number.isNaN(quantity)){
        return res.status(400).json({ success: false, message: "Quantity must of valid Type" });
    }
    if (quantity <= 0) {
        return res.status(400).json({ success: false, message: "Quantity must be greater than zero" });
    }
    try {
        const now = new Date();
        const insertResult = await insertTransaction(email, symbol, quantity, transaction_type, now);
        if (!insertResult) {
            return res.status(503).json({ success: false, message: "Failed to add transaction" });
        }
        if(insertResult.success === false){
            return res.status(504).json({ success: false, message: insertResult.message });
        }
        const newActivity = {
            os_type: req.activeSession.osType,
            browser_type: req.activeSession.browserType,
            type: `${transaction_type} ${symbol} in portfolio`,
            message: "Made a Transaction by user",
            token: req.cookies.token,
        };
        await addActivityHistory(email, newActivity);
        return res.status(200).json({ success: true, message: "Transaction added successfully" });
    }
    catch (error) {
        console.log('Add transaction error:', error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};