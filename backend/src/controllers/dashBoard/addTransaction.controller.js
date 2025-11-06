import { insertTransaction } from "../../db/insertTransaction.js";


export const addTransaction = async (req, res) => {
    let { symbol, quantity,transaction_type } = req.body;
    const email = req.user.email;
    if (!email || !symbol || !quantity || !transaction_type) {
        return res.status(401).json({ success: false, message: "All fields are required" });
    }
    transaction_type = transaction_type.toUpperCase();
    let check_transaction_type = ['BUY','SELL'];
    if(!check_transaction_type.includes(transaction_type)){
        return res.status(400).json({success:false,message:"Invalid transaction type."});
    } 
    if (quantity <= 0) {
        return res.status(400).json({ success: false, message: "Quantity must be greater than zero" });
    }
    try {
        const now = new Date();
        const insertResult = await insertTransaction(email, symbol, quantity, transaction_type, now);
        if (!insertResult) {
            return res.status(500).json({ success: false, message: "Failed to add transaction" });
        }
        if(insertResult.success === false){
            return res.status(400).json({ success: false, message: insertResult.message });
        }
        return res.status(200).json({ success: true, message: "Transaction added successfully" });
    }
    catch (error) {
        console.log('Add transaction error:', error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};