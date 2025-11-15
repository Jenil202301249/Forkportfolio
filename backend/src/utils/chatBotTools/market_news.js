import { z } from "zod";
import { tool } from "@langchain/core/tools";
import { JigsawStack } from "jigsawstack";
import dotenv from "dotenv";
import { getStockSummary } from "../../db/stockSummary.js"
dotenv.config();


const jigsaw = JigsawStack({ apiKey: process.env.JIGSAWSTACK_API_KEY });


export const Market_news_tool = tool(
    async (input,context) => {
        const { queryType,stockSymbol,sectors,country,dateRange,keywords,includePortfolio } = input;
        const userDetails = context.configurable.userDetails;
        const email_Id = userDetails.emailId;
        let allStocks = stockSymbol || [];
        if(includePortfolio || queryType==="portfolio" || queryType==="auto"){
            try{
                if(email_Id){
                    const userPortfolio = await getStockSummary(email_Id); // mock fn
                    console.log("query type is portfolio/auto, fetching user portfolio for userId:", email_Id , "with portfolio:", userPortfolio);
                    const portfolioSymbols = userPortfolio.map((s) => s.symbol);
                    allStocks = [...new Set([...allStocks, ...portfolioSymbols])]
                }
            }catch(err){
                console.error("Error fetching user portfolio for market news:", err.message);
            }
        }

        //step 2 : Decide what to fetch based on queryType

        let newsResults = [];

        if(queryType === "stock" && allStocks.length > 0){
            console.log("queryType is stock, for userId :",email_Id);
            for(const symbol of allStocks){
                try{
                const news = await jigsaw.web.search({
                    query: `Latest news on ${symbol} stock ${country || ""} ${dateRange ? `from:${dateRange.from} to:${dateRange.to}` : "" }`
                });
                newsResults.push({ source: "JigsawStack", symbol, news: news.ai_overview});
                // console.log("JigsawStack results for stock:", news.ai_overview);
                }catch(err){
                    console.error(`Error fetching news for stock ${symbol}:`, err.message);
                }
            }
        }
            if(queryType === "sector" && sectors && sectors.length > 0){
                console.log("queryType is sector, for userId :",email_Id);
                for(const sector of sectors){
                    try{
                        const searchToolRes = await jigsaw.web.search({ 
                            query: `${sector} sector stock market news ${country || ""} ${dateRange ? `from:${dateRange.from} to:${dateRange.to}` : "" }`
                         });
                        newsResults.push({source: "JigsawStack", sector, news: searchToolRes.ai_overview}); 
                        // console.log("JigsawStack results for sector:", searchToolRes.ai_overview);
                    }catch(err){
                        console.log(`Error fetching news for sector ${sector}:`, err.message);
                    }
                }
        
            }
         if(queryType === "market")
            console.log("queryType is market, for userId :",email_Id);
            try{
                const marketNews = await jigsaw.web.search({
                    query: `Latest stock market news ${country || ""} ${dateRange ? `from:${dateRange.from} to:${dateRange.to}` : "" }`
                });
                newsResults.push({ source: "JigsawStack", news: marketNews.ai_overview});
                // console.log("JigsawStack results for market news:", marketNews.ai_overview);
            }
            catch(err){
                console.error("Error fetching market news:", err.message);
            }

            if(queryType === "keyword" && keywords && keywords.length > 0){
                console.log("queryType is keyword, for userId :",email_Id);
                for(const keyword of keywords){
                    try{
                        const keywordNews = await jigsaw.web.search({
                            query: `Latest news on ${keyword} ${country || ""} ${dateRange ? `from:${dateRange.from} to:${dateRange.to}` : "" }`
                        });
                        newsResults.push({ source: "JigsawStack", keyword, news: keywordNews.ai_overview});
                        // console.log("JigsawStack results for keyword:", keywordNews.ai_overview);
                    }catch(err){
                        console.error(`Error fetching news for keyword ${keyword}:`, err.message);
                    }
                }
            }
            if(newsResults.length === 0){
                console.log("JigsawStack tool fallback for general finance news");
                try{
                    const generalNews = await jigsaw.web.search({
                        query: `Top finance news ${country || ""} ${dateRange ? `from:${dateRange.from} to:${dateRange.to}` : "" }`
                    });
                    newsResults.push({ source: "JigsawStack", news: generalNews.ai_overview});
                    // console.log("JigsawStack results for general finance news:", generalNews.ai_overview);
                }catch(err){
                    console.error("Error fetching general finance news:", err.message);
                }
            }
        console.log("Market news results:", newsResults);
        return JSON.stringify(newsResults);

    },{
        name: "market_news",
        description: `
      A robust financial news retriever.
      Can fetch stock, sector, market, or portfolio-related news dynamically.
      Handles flexible inputs such as stock tickers, keywords, date ranges, and country filters.
      Can auto-fetch user's portfolio if requested.
    `,
        schema : z.object({
          queryType: z
        .enum(["stock", "sector", "market", "keyword", "portfolio", "auto"])
        .describe(
          "Determines the nature of the user's request: specific stock, sector, general market, keyword search, or user's portfolio news. 'auto' lets the model infer automatically."
        ),

          stockSymbol: z
            .array(z.string())
            .optional()
            .describe("Array of stock tickers (e.g., ['TCS.NS', 'INFY.NS']). Used when user asks about specific companies."),

            sectors: z
              .array(z.string())
              .optional()
              .describe("Array of sector names (e.g., ['IT', 'Finance']). Used when user asks about specific industries or sectors."),

            country : z
              .string()
              .optional()
              .default("India")
              .describe("Country for localized financial news (default: India)."),

            dateRange : z
                .object({
                  from: z.string().optional().describe("Start date in YYYY-MM-DD format."),
                  to: z.string().optional().describe("End date in YYYY-MM-DD format."),
                })
                .optional()
                .describe("Date range for filtering news articles."),

            keywords: z
            .array(z.string())
            .optional()
            .describe("Array of custom search keywords if the user gives phrases like 'AI in finance' or 'RBI policy'."),

            includePortfolio : z
            .boolean()
            .optional()
            .default(false)
            .describe("Whether to include the user's saved portfolio stocks automatically in the query.")
        }),
        
    }
);