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
    ctx.state.data = {
        title: 'TLDR Newsletter Archives',
        description: 'TLDR Newsletter Archives',
        link: `${baseUrl}/newsletter/archives`,
        language: 'en',
        item: await Promise.all(
            $('.mt-2', '#doc-container')
                .map((_, item) =>
                    ctx.cache.tryGet(item, async () => {
                        item = $(item);
                        const link = item.find('a').attr('href');
                        const pubDate = link.replace('/newsletter/', '');
                        const itemUrl = `${baseUrl}${link}`;
                        const response = await got({
                            method: 'get',
                            url: String(itemUrl),
                        });
                        const description = cheerio.load(response.data).html();
                        return {
                            title: item.text(),
                            link: String(itemUrl),
                            pubDate,
                            description,
                            author: 'TLDR',
                        };
                    })
                )
                .get()
        ),
    };
};
