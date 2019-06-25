const ytdl = require('ytdl-core');
const fs = require('fs');
const path = require('path');
const search = require('youtube-search')
const youtubeAPI = require(path.join(path.resolve(__dirname, '..'), 'config/botLogin')).youtubeAPI;

module.exports.search = function(message) {
	return new Promise((resolve, reject) => {
		search(message, {maxResults: 5, key: youtubeAPI}, function(err, results) {
			if(err) reject(err);

			if(results){
				var searchResults = [];
				for(var i = 0 ; i < results.length; i++){
					if(i === 5) break;
					if(results[i].kind === 'youtube#video'){
						searchResults.push({
							title: results[i].title,
							id: results[i].id,
							url: results[i].link
						});
					}
				}
				resolve(searchResults);
			} else {
				reject(new Error('No results found'));
			}
		});
	});
	
}

var ytdl_options = {
	quality: 'lowest',
	filter: 'audioonly'
}

module.exports.getInfo = function(opts){
	return new Promise((resolve, reject) => {
		try{
			ytdl.getInfo(opts.url, ytdl_options, (err, rawData) => {
				if(err) reject(err);
				var filePath;
				if("local" in opts){
					filePath = path.join(opts.local, rawData.title+'.mp3');
				} else
					filePath = path.join(opts.temp, rawData.video_id+'.mp3');

				resolve({
					path: filePath,
					url: opts.url,
					id: rawData.video_id,
					title: rawData.title,
					length: rawData.length_seconds
				});
			});
		} catch(err) {
			if(err) reject(err)
		}
	});
}

module.exports.getStream = function(url,callback){
	callback(ytdl(url, ytdl_options));
}

module.exports.getFile = function(opts){
	return new Promise((resolve, reject) => {
		try{
			ytdl(opts.url, ytdl_options).pipe(fs.createWriteStream(opts.path))
			setTimeout(resolve, 8000)
		}
		catch(err){
			if(err) reject(err)
		}
	});
}
