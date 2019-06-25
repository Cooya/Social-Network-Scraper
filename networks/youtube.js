const sleep = require('sleep');
const request = require('request-promise');

class NotFoundError extends Error {
	constructor() {
		super('Not found');
	}
}
class QuotaExceededError extends Error {
	constructor() {
		super('Quota exceeeded');
	}
}

// expensive method, it uses a lot of quota
async function getChannelVideos_expensive(channelId) {
	const params = {
		key: 'AIzaSyCZUzsEt22XubrBqE5-iQ7nGPoudRSBWEM',
		part: 'snippet',
		channelId,
		maxResults: 50,
		type: 'video'
	};

	const videos = [];
	let res = null;
	do {
		res = await get('https://www.googleapis.com/youtube/v3/search', params);
		for(let item of res['items'])
			videos.push(item);
		params['pageToken'] = res['nextPageToken'];
	} while(params['pageToken']);

	return videos;
}

async function retrieveChannelData(channelId) {
	const data = {channelId, videos: []};

	const params = {
		key: 'AIzaSyCZUzsEt22XubrBqE5-iQ7nGPoudRSBWEM',
		part: 'contentDetails,statistics',
		id: channelId
	};
	console.log('Getting playlist id...');
	res = await get('https://www.googleapis.com/youtube/v3/channels', params);

	data['videoCount'] = res['items'][0]['statistics']['videoCount'];
	data['viewCount'] = res['items'][0]['statistics']['viewCount'];
	data['subscriberCount'] = res['items'][0]['statistics']['subscriberCount'];

	const videos = await getChannelVideos(res['items'][0]['contentDetails']['relatedPlaylists']['uploads']);
	for(let video of videos) {
		data.videos.push({
			id: video.id,
			...video.statistics
		});
	}

	return data;
}

async function getChannelVideos(uploadId) {
	let res, params, videoIds = [], videos = [];
	
	// get video ids
	params = {
		key: 'AIzaSyCZUzsEt22XubrBqE5-iQ7nGPoudRSBWEM',
		part: 'contentDetails',
		playlistId: uploadId,
		maxResults: 50
	};
	do {
		console.log('Getting video ids...');
		res = await get('https://www.googleapis.com/youtube/v3/playlistItems', params);
		for(let item of res['items'])
			videoIds.push(item['contentDetails']['videoId']);
		params['pageToken'] = res['nextPageToken'];
	} while(params['pageToken']);

	// get statistics for every video
	params = {
		key: 'AIzaSyCZUzsEt22XubrBqE5-iQ7nGPoudRSBWEM',
		part: 'statistics'
	};
	for(let i = 0; i < videoIds.length; i += 50) {
		params.id = videoIds.slice(i, i + 50).map(v => v).join(',');
		console.log('Getting video statistics...');
		res = await get('https://www.googleapis.com/youtube/v3/videos', params);
		for(let item of res.items)
			videos.push(item);
	}

	return videos;
}

async function get(url, params) {
	let res;
	try {
		res = await request({
			method: 'GET',
			url,
			qs: params,
			gzip: true,
			json: true,
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
		if (statusCode == 403 && e.response.body.error.errors[0].reason == 'quotaExceeded')
			throw new QuotaExceededError();

		throw e;
	}

	return res;
}

module.exports = {
	retrieveChannelData
};