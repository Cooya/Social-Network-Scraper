const facebook = require('./networks/facebook');
const instagram = require('./networks/instagram');

(async () => {
	// const likes = await facebook.getFacebookPageLikes('adidasFR');
	// console.log(likes);

	const res = await instagram.getPosts('13460080');
	console.log(res.length);
})();
