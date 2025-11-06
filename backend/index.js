import "dotenv/config";
import { connectDB, sql } from "./src/db/dbConnection.js";
import {connectmongoDB} from "./src/mongodb/mongoConnection.js";
import { app } from "./app.js";
import { updateAllUsers } from "./src/utils/addPortfolioValuation.js";
import { JobMeta } from "./src/mongoModels/jobData.model.js";
import cron from "node-cron";

connectDB();
await connectmongoDB();

app.listen(process.env.PORT || 8000, async()=>{
        console.log(`Server is running at port : ${process.env.PORT||8000}`);
        await updateAllUsers()
        setInterval(updateAllUsers,60*60*1000)
        let lastrun = await JobMeta.findOne({jobName:"Update yestarday"});
        const lastRunTime = lastrun?.lastRun ? new Date(lastrun.lastRun).getTime() : 0;
        if (Date.now() - lastRunTime > 24 * 60 * 60 * 1000) {
            try{
                const result = await sql`UPDATE "stock_summary" SET yestarday_holding=current_holding RETURNING email`;
                if(result){
                    await JobMeta.updateOne({jobName: "Update yestarday"},
                    { $set: { lastRun: new Date() } },
                    { upsert: true,new: true })
                } 
            }catch(error){
                console.log("Update Price error");
            }
            
        }
        cron.schedule("0 0 * * *", async () => {
            const result = await sql`UPDATE "stock_summary" SET yestarday_holding=current_holding RETURNING email`;
            if(result){
                await JobMeta.updateOne({jobName: "Update yestarday"},
                { $set: { lastRun: new Date() } },
                { upsert: true,new: true })
            }
        }, {
        timezone: "Asia/Kolkata"
        });
    })