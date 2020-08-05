const request = require('request'),
	bars = require('bars'),
	fs = require('fs')

const options = {
	url: 'https://codestats.net/api/users/vergissberlin',
	readmeFile: './tests/fixtures/README.md'
}

/**
 * Request callback
 *
 * @param {*} error
 * @param {*} response
 * @param {*} body
 */
const callback = function (error, response, body) {
	if (!error && response.statusCode == 200) {
		const languages = Object.entries(JSON.parse(body).languages)
		updateReadme(buildChart(languages))
	}
}

/**
 * Sort descending.
 */

function sortDescending(a, b) {
	return b.val - a.val;
  }
  

/**
 * Build chart with data
 *
 * @param {Array} data
 * @returns {String}
 */
const buildChart = function (data) {
	let languageChart = {}
	data.sort(function (a, b) {
		return b[1].xps - a[1].xps
	})
	data = data.slice(0, 6)
	data.forEach(([key, value]) => {
		languageChart = Object.assign(languageChart, {
			[key]: value.xps
		})
	})
	return bars(languageChart, { bar: '█', width: 24, sort: false, limit: 2 })
}

/**
 * Update the content of readme file
 *
 * @param {*} content
 */
const updateReadme = function (content) {
	fs.readFile(options.readmeFile, 'utf8', function (err, data) {
		if (err) {
			return console.log(err)
		}
		let replacement = `<!-- START_SECTION:codestats -->\n\`\`\`text\n\r${content}\`\`\`\n<!-- END_SECTION:codestats -->`
		let result = data.replace(
			/((<!--.*START_SECTION:codestats.*-->)([\s\S]+)(<!--.*END_SECTION:codestats.*-->))/g,
			replacement
		)

		fs.writeFile(options.readmeFile, result, 'utf8', function (err) {
			if (err) return console.log(err)
		})
	})
}

request(options, callback)
