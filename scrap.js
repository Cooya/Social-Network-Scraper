#!/usr/bin/env node

const csv = require('csvtojson');
const dateFormat = require('dateformat');
const xlsx = require('xlsx');

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

		if(!inputFile || !outputFile || !inputFile.endsWith('.csv') || !outputFile.endsWith('.xlsx')) {
			console.log('Usage: scrap-social-networks --input in.csv --output out.xlsx');
			process.exit();
		}
		
		const inputData = await csv({delimiter: ';'}).fromFile(inputFile),
			accountsArray = [],
			postsArray = [];

		// headers
		accountsArray.push([dateFormat(new Date(), 'dd/mm/yyyy hh:mm'), 'Facebook / Page URL', 'Facebook / Like count', 'Instagram / Account URL', 'Instagram / Follower count', 'Instagram / Post count', 'Youtube / Channel URL', 'Youtube / Video count', 'Youtube / View count', 'Youtube / Subscriber count']);
		postsArray.push(['User', 'URL', 'Date de publication', 'Type', 'View count', 'Like count', 'Dislike count', 'Favorite count', 'Comment count', 'Engagement']);
		let data;
		for(let row of inputData) {

			if(row['username Facebook']) {
				console.log(`${row['PrenomNom']} : retrieving Facebook page likes...`);
				data = await facebook.getFacebookPageLikes(row['username Facebook']);

				accountsArray.push([
					row['PrenomNom'],
					'https://www.facebook.com/' + row['username Facebook'],
					data
				]);
			}

			if(row['username Instagram']) {
				console.log(`${row['PrenomNom']} : retrieving Instagram account data...`);
				data = await instagram.retrieveInfluencerData(row['username Instagram']);

				accountsArray.push([
					row['PrenomNom'],
					'',
					'',
					data.url,
					data.followerCount,
					data.postCount
				]);
				
				for(let post of data.posts) {
					postsArray.push([
						row['PrenomNom'],
						post.url,
						dateFormat(post.publicationDate, 'dd/mm/yyyy hh:mm'),
						post.type,
						'',
						post.likeCount,
						'',
						'',
						post.commentCount,
						post.engagement
					]);
				}
			}

			if(row['Chaine Youtube']) {
				console.log(`${row['PrenomNom']} : retrieving Youtube channel data...`);
				data = await youtube.retrieveChannelData(row['Chaine Youtube']);

				accountsArray.push([
					row['PrenomNom'],
					'',
					'',
					'',
					'',
					'',
					data.url,
					data.videoCount,
					data.viewCount,
					data.subscriberCount
				]);
				
				for(let video of data.videos) {
					postsArray.push([
						row['PrenomNom'],
						video.url,
						dateFormat(video.publicationDate, 'dd/mm/yyyy hh:mm'),
						'Youtube',
						video.viewCount,
						video.likeCount,
						video.dislikeCount,
						video.favoriteCount,
						video.commentCount,
						video.engagement
					]);
				}
			}
		}

		const workbook = xlsx.utils.book_new();
		xlsx.utils.book_append_sheet(workbook, xlsx.utils.aoa_to_sheet(accountsArray), 'accounts');
		xlsx.utils.book_append_sheet(workbook, xlsx.utils.aoa_to_sheet(postsArray), 'posts');
		xlsx.writeFile(workbook, outputFile);
	} catch(e) {
		console.error(e);
	}
})();
