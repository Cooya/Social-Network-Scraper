const request = require('request-promise');
const sleep = require('sleep');

class NotFoundError extends Error {}
class UnavailableDataError extends Error {}

async function retrieveInfluencerData(username) {
	const data = {username, posts: []};

	const user = await getUserProfile(username);
	data['id'] = user['id'];
	data['followerCount'] = user['edge_followed_by']['count'];
	data['postCount'] = user['edge_owner_to_timeline_media']['count'];

	const posts = await getPosts(user['id']);
	let likeCount, commentCount;
	for(let post of posts) {
		likeCount = post['edge_media_preview_like'] ? post['edge_media_preview_like']['count'] : 0;
		commentCount = post['edge_media_to_comment'] ? post['edge_media_to_comment']['count'] : 0;
		data.posts.push({
			url: 'https://www.instagram.com/p/' + post['shortcode'],
			likeCount,
			commentCount,
			engagement: ((likeCount + commentCount) / data['followerCount']).toFixed(3)
		});
	}

	return data;
}

async function getLocation(locationId) {
	let body;
	try {
		body = await get('https://www.instagram.com/explore/locations/' + locationId + '?__a=1');
	} catch (e) {
		if (e instanceof NotFoundError) return null;
		throw e;
	}
	try {
		return JSON.parse(body)['graphql']['location'];
	} catch(e) {
		if(body.startsWith('<!DOCTYPE html>')) throw new UnavailableDataError();
		throw e;
	}
}

async function getMedia(shortcode) {
	let body;
	try {
		body = await get('https://www.instagram.com/p/' + shortcode + '?__a=1');
	} catch (e) {
		if (e instanceof NotFoundError) return null;
		throw e;
	}
	try {
		return JSON.parse(body)['graphql']['shortcode_media'];
	} catch(e) {
		if(body.startsWith('<!DOCTYPE html>')) throw new UnavailableDataError();
		throw e;
	}
}

async function getUserProfile(username) {
	let body;
	try {
		body = await get('https://www.instagram.com/' + username + '?__a=1');
	} catch (e) {
		if (e instanceof NotFoundError) return null;
		throw e;
	}
	try {
		return JSON.parse(body)['graphql']['user'];
	} catch(e) {
		if(body.startsWith('<!DOCTYPE html>')) throw new UnavailableDataError();
		throw e;
	}
}

async function getPosts(userId, first = 50, cursor = null) {
	let body;
	try {
		body = await get('https://www.instagram.com/graphql/query/', {
			'query_hash': 'f2405b236d85e8296cf30347c9f08c2a',
			'variables': JSON.stringify({
				id: userId,
				first,
				after: cursor
			})
		});
	} catch (e) {
		throw e;
	}
	try {
		return JSON.parse(body)['data']['user']['edge_owner_to_timeline_media']['edges'].map(x => x['node']);
	} catch(e) {
		throw e;
	}
}

async function get(url, params) {
	const headers = {
		Accept: '*/*',
		'Accept-Encoding': 'gzip, deflate, br',
		'Accept-Language': 'en-US',
		'Cache-Control': 'no-cache',
		Connection: 'keep-alive',
		Pragma: 'no-cache',
		'Upgrade-Insecure-Requests': 1,
		'User-Agent': 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:67.0) Gecko/20100101 Firefox/67.0'
	};

	let res;
	try {
		res = await request({
			method: 'GET',
			url,
			qs: params,
			headers,
			gzip: true,
			timeout: 30000
		});
	} catch (e) {
		if(e.code == 'ESOCKETTIMEDOUT') {
			console.warn('Time out, trying again in 10 seconds...');
			sleep.sleep(10);
			return get(url, params);
		}

		const statusCode = e.response.statusCode;
		if (statusCode == 429) {
			console.warn('Too many requests to Instagram.com, waiting for 10 seconds...');
			sleep.sleep(10);
			return get(url, params);
		}
		if (statusCode == 502 || statusCode == 503) {
			console.warn('Bad gateway or service unavailable, waiting for 10 seconds...');
			sleep.sleep(10);
			return get(url, params);
		}
		if (statusCode == 404) throw new NotFoundError();

		throw e;
	}

	return res;
}

module.exports = {
	retrieveInfluencerData
};
