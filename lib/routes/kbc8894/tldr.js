const got = require('@/utils/got');
const cheerio = require('cheerio');

module.exports = async (ctx) => {
    const baseUrl = 'https://tldr.tech';
    const rootUrl = `${baseUrl}/newsletter`;
    const response = await got({
        method: 'get',
        url: rootUrl,
    });
    const $ = cheerio.load(response.data);
    const list = $('.mt-2', '#doc-container')
        .map((_, item) => {
            item = $(item);
            const title = item.text();
            const link = item.find('a').attr('href');
            const pubDate = link.replace('/newsletter/', '');
            const itemUrl = `${baseUrl}${link}`;
            return {
                title,
                link: itemUrl,
                pubDate,
            };
        })
        .get();
    ctx.state.data = {
        title: 'TLDR Newsletter Archives',
        description: 'TLDR Newsletter Archives',
        link: `${baseUrl}/newsletter/archives`,
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
                        author: 'TLDR',
                    };
                })
            )
        ),
    };
};
