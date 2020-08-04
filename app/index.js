var request = require('request')

var options = {
	url: 'https://codestats.net/api/users/vergissberlin'
}

function callback(error, response, body) {
	if (!error && response.statusCode == 200) {
		const languages = Object.keys(JSON.parse(body).languages)
		languages.sort(function (a, b) {
			return b.xps - a.xps
		})
		console.log(languages)
	}
}

request(options, callback)
