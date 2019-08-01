const request = require('request-promise');
const cheerio = require('cheerio');

async function getFacebookPageLikes(pageName) {
	const url = 'https://www.facebook.com/' + pageName;
	const html = await request.get(encodeURI(url), {
		headers: {
			'User-Agent': 'PostmanRuntime/7.13.0',
			'Accept-Language': 'en-GB,en;q=0.5'
		}
	});
	const $ = cheerio.load(html);
	const text = $('#PagesProfileHomeSecondaryColumnPagelet').text();
	const likes = text.match(/([0-9,]+) people like this/);
	if(!likes)
		throw new Error(`The like count of the Facebook page "${url}" has not been found.`);
	return parseInt(likes[1].replace(/[^0-9]/g, ''));
}

module.exports = {getFacebookPageLikes};
