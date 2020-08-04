const request = require('request')
const barChart = require('bar-charts')

const options = {
	url: 'https://codestats.net/api/users/vergissberlin'
}

function callback(error, response, body) {
	if (!error && response.statusCode == 200) {
		const languages = Object.entries(JSON.parse(body).languages)
		let languageChart = []

		languages.forEach(([key, value]) => {
			languageChart.push({ label: key, count: value.xps })
		})
		languageChart.sort(function (a, b) {
			return b.count - a.count
		})

		console.log(barChart(languageChart.slice(0, 6)))
	}
}

request(options, callback)
