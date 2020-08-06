const 
	bars = require('bars'),
	fs = require('fs'),
	request = require('request'),
	simpleGit = require('simple-git')

// Validate environment varialbes
if (typeof process.env.CODESTATS_USERNAME == 'undefined')
	throw new Error('InvalidArgumentExcpetion – The CODESTATS_USERNAME has to be set!')

// Options
const options = {
	codestats : {
		username: process.env.CODESTATS_USERNAME,
		url: `https://codestats.net/api/users/${process.env.CODESTATS_USERNAME}`,
		profile: `https://codestats.net/users/${process.env.CODESTATS_USERNAME}`,
	},
	git: {
		user: process.env.GIT_USERNAME || 'CodeStats bot',
		message: process.env.COMMIT_MESSAGE || 'Update codestats metrics'
	},
	graph: {
		width: process.env.GRAPH_WIDTH || 42
	},
	readmeFile: process.env.README_FILE || 'tests/fixtures/README.md',
	show: {
		title: process.env.SHOW_TITLE || false,
		link: process.env.SHOW_LINK || false
	}
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
		commitChanges()
	}
}

/**
 * Commit changes in README file
 */
const commitChanges = function () {
	const git = simpleGit()
	git.commit(options.git.message, options.readmeFile, { '--author': options.git.user }).push()
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
	return bars(languageChart, { bar: '█', width: options.graph.width })
}

/**
 * Update the content of readme file
 *
 * @param {*} content
 */
const updateReadme = function (content) {
	fs.readFile(options.readmeFile, 'utf8', function (err, data) {
		let header = options.show.title ? `*Language experience level (Last update ${new Date().toUTCString()})*\n\n` : '',
			footer = options.show.link ? `\n> My [CodeStats profile](${options.codestats.profile}) in detail.\n` : ''

		if (err) {
			return console.log(err)
		}
		let replacement = `<!-- START_SECTION:codestats -->\n${header}\`\`\`text\n${content}\`\`\`\n${footer}<!-- END_SECTION:codestats -->`
		let result = data.replace(
			/((<!--.*START_SECTION:codestats.*-->)([\s\S]+)(<!--.*END_SECTION:codestats.*-->))/g,
			replacement
		)

		fs.writeFile(options.readmeFile, result, 'utf8', function (err) {
			if (err) return console.log(err)
		})
	})
}

// Init request
request(options.codestats, callback)
