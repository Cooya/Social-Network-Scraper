#!/usr/bin/env node

const csv = require('csvtojson');
const fs = require('fs');

const facebook = require('./networks/facebook');
const instagram = require('./networks/instagram');
const youtube = require('./networks/youtube');

(async () => {
	try {
		let inputFile, outputFile;
		for(let i = 0; i < process.argv.length; ++i) {
			if(process.argv[i] == '--input')
				inputFile = process.argv[i + 1];
			if(process.argv[i] == '--output')
				outputFile = process.argv[i + 1];
		}

		if(!inputFile || !outputFile) {
			console.log('Usage: scrap-social-networks --input in.csv --output out.csv');
			process.exit();
		}

		const inputData = await csv({delimiter: ';'}).fromFile(inputFile), outputData = [];
		let data;
		for(let row of inputData) {
			outputData.push([row['PrenomNom']]);

			if(row['username Facebook']) {
				console.log(`${row['PrenomNom']} : retrieving Facebook page likes...`);
				data = await facebook.getFacebookPageLikes(row['username Facebook']);

				outputData.push(['Facebook', 'Page URL', 'Likes count']);
				outputData.push([
					'',
					'https://www.facebook.com/' + row['username Facebook'],
					data
				]);
			}

			if(row['username Instagram']) {
				console.log(`${row['PrenomNom']} : retrieving Instagram account data...`);
				data = await instagram.retrieveInfluencerData(row['username Instagram']);

				outputData.push(['Instagram', 'Account URL', 'Follower count', 'Post count']);
				outputData.push([
					'',
					'https://www.instagram.com/' + data.username,
					data.followerCount,
					data.postCount
				]);
				
				outputData.push(['Instagram post', 'URL', 'Type', 'Like count', 'Comment count', 'Engagement']);
				for(let post of data.posts) {
					outputData.push([
						'',
						post.url,
						post.type,
						post.likeCount,
						post.commentCount,
						post.engagement
					]);
				}
			}

			if(row['Chaine Youtube']) {
				console.log(`${row['PrenomNom']} : retrieving Youtube channel data...`);
				data = await youtube.retrieveChannelData(row['Chaine Youtube']);

				outputData.push(['Youtube', 'Channel URL', 'Video count', 'View count', 'Subscriber count']);
				outputData.push([
					'',
					'https://www.youtube.com/channel/' + data.channelId,
					data.videoCount,
					data.viewCount,
					data.subscriberCount
				]);
				
				outputData.push(['Youtube video', 'URL', 'View count', 'Like count', 'Dislike count', 'Favorite count', 'Comment count']);
				for(let video of data.videos) {
					outputData.push([
						'',
						'https://www.youtube.com/watch?v=' + video.id,
						video.viewCount,
						video.likeCount,
						video.dislikeCount,
						video.favoriteCount,
						video.commentCount
					]);
				}
			}

			outputData.push([]);
		}

		let outputStr = '';
		for(let row of outputData)
			outputStr += row.join(';') + '\n';
		fs.writeFileSync(outputFile, outputStr);
	} catch(e) {
		console.error(e);
	}
})();
