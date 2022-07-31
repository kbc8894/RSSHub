const got = require('@/utils/got');
const cheerio = require('cheerio');

module.exports = async (ctx) => {
    const baseUrl = 'https://www.kdnuggets.com/feed';
    const response = await got({
        method: 'get',
        url: baseUrl,
    });
    const $ = cheerio.load(response.data, { xmlMode: true });
    const list = $('item')
        .map((_, item) => {
            item = $(item);
            const title = item.find('title').text();
            const link = item.find('link').text();
            const pubDate = item.find('pubDate').text();
            return {
                title,
                link,
                pubDate,
            };
        })
        .get();
    ctx.state.data = {
        title: 'KDnuggets',
        description: 'Data Science, Machine Learning, AI &#38; Analytics',
        link: 'https://www.kdnuggets.com',
        language: 'en',
        item: await Promise.all(
            list.map((item) =>
                ctx.cache.tryGet(item.link, async () => {
                    const response = await got({
                        method: 'get',
                        url: item.link,
                    });
                    const description = cheerio.load(response.data).html();
                    return {
                        title: item.title,
                        link: item.link,
                        pubDate: item.pubDate,
                        description,
                        author: 'KDnuggets',
                    };
                })
            )
        ),
    };
};
