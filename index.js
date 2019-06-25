const facebook = require('./networks/facebook');
const instagram = require('./networks/instagram');
const youtube = require('./networks/youtube');

(async () => {
	try {
		let data;

		// const likes = await facebook.getFacebookPageLikes('adidasFR');
		// console.log(likes);

		data = await instagram.retrieveInfluencerData('greenpeace');
		console.log(data.posts.length);

		// data = await youtube.retrieveChannelData('UChV2oq_a-UZfJF-UiW0u-DQ');
		// console.log(data);
	} catch(e) {
		console.error(e);
	}
})();
