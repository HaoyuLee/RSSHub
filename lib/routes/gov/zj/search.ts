import { Route } from '@/types';
import { parseDate } from '@/utils/parse-date';
import got from '@/utils/got';
import { load } from 'cheerio';
import dayjs from 'dayjs';

export const route: Route = {
    path: '/zj/search/:websiteid?/:word/:cateid?/:sortType?',
    categories: ['government'],
    example: '/gov/zj/search',
    parameters: {
        websiteid: '搜索范围-全省、各市各区、详细信息点击源网站https://www.zj.gov.cn/请求中寻找',
        word: '搜索关键词-默认：人才',
        cateid: '信息分类-默认：658（全部）',
        sortType: '排序类型-默认：2（按时间）',
    },
    radar: [
        {
            source: ['search.zj.gov.cn/jsearchfront/search.do'],
            target: '/zj/search/:websiteid?/:word/:cateid?/:sortType?',
        },
    ],
    name: '浙江省人民政府-全省政府网站统一搜索',
    url: 'search.zj.gov.cn/jsearchfront/search.do',
    maintainers: ['HaoyuLee'],
    description: `| 参数    | 说明 | 默认值                    |
|-------| -- |------------------------|
| websiteid  | 行政区域 | 330201000000000（宁波市本级） |
| word | 搜索关键词    | ‘人才’                   |
| cateid  | 信息分类    | 658（全部）                |
| sortType  |   排序类型  | 2（按时间）                 |`,
    async handler(ctx) {
        const { websiteid = '330201000000000', word = '人才', cateid = 658, sortType = 2 } = ctx.req.param();
        const {
            data: { result: list },
        } = await got.post('https://search.zj.gov.cn/jsearchfront/interfaces/cateSearch.do', {
            form: {
                websiteid,
                pg: '30',
                p: '1',
                cateid,
                word,
                checkError: 1,
                isContains: 0,
                q: word,
                begin: dayjs().subtract(1, 'week').format('YYYYMMDD'),
                end: dayjs().format('YYYYMMDD'),
                timetype: 2,
                pos: 'title,content,keyword',
                sortType,
            },
        });
        const items =
            list?.map((item: string) => {
                const $ = load(item);
                const title = $('.titleWrapper>a');
                const footer = $('.sourceTime>span');
                return {
                    title: title.text().trim() || '',
                    link: title.attr('href') || '',
                    pubDate: parseDate(footer.eq(1).text().trim().replace('时间:', '')) || '',
                    author: footer.eq(0).text().trim().replace('来源:', '') || '',
                    description: $('.newsDescribe>a').text() || '',
                };
            }) || [];
        // items.map(async (item) => {
        //     return await cache.tryGet(item.link, async () => {
        //         const { data: article } = await got.get(item.link);
        //         const $ = await load(article);
        //         return {
        //             ...item,
        //             pubDate: $('#c > tbody > tr.fwly > td > ul.list > li:nth-child(1)').text().trim().replace('日期：', ''),
        //             description: $('#c > tbody').html(),
        //         };
        //     });
        // });
        return {
            title: '浙江省人民政府-全省政府网站统一搜索',
            link: 'https://search.zj.gov.cn/jsearchfront/search.do',
            item: items,
        };
    },
};
