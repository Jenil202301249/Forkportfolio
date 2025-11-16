import YahooFinance from 'yahoo-finance2';
const yahooFinance = new YahooFinance();
export const getNews = async (symbol) => {
  try {
    const result = await yahooFinance.news(symbol);
    return result.map((news) => ({
        title: news.title,
        link: news.link,
        publisher: news.publisher,
        providerPublishTime: news.providerPublishTime,
        type: news.type,
    }));
  } catch (error) {
    console.log('Error fetching news:', error);
    return null;
  }
};