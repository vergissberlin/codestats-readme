const bars = require('bars'),
	fs = require('fs'),
	request = require('request'),
	simpleGit = require('simple-git')

/**
 * Debugging
 */
if (typeof process.env.INPUT_DEBUG !== 'undefined') {
	console.log(process.env)
}

// Validate environment varialbes
if (typeof process.env.INPUT_CODESTATS_USERNAME == 'undefined')
	throw new Error('InvalidArgumentExcpetion – The CODESTATS_USERNAME has to be set!')

// Options
const options = {
	codestats: {
		username: String(process.env.INPUT_CODESTATS_USERNAME),
		url: `https://codestats.net/api/users/${process.env.INPUT_CODESTATS_USERNAME}`,
		profile: `https://codestats.net/users/${process.env.INPUT_CODESTATS_USERNAME}`
	},
	git: {
		username: String(process.env.GITHUB_ACTOR) || 'CodeStats bot',
		message: String(process.env.INPUT_COMMIT_MESSAGE) || 'Update codestats metrics',
		token: String(process.env.INPUT_GITHUB_TOKEN)
	},
	graph: {
		width: Number(process.env.INPUT_GRAPH_WIDTH) || 42
	},
	readmeFile: String(process.env.INPUT_README_FILE) ? `${process.env.INPUT_README_FILE}` : `./README.md`,
	show: {
		title: Boolean(process.env.INPUT_SHOW_TITLE) || false,
		link: Boolean(process.env.INPUT_SHOW_LINK) || false
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
		updateReadme(buildChart(languages), commitChanges)
	}
}

/**
 * Commit changes in README file
 */
const commitChanges = function () {
	const git = simpleGit()
	if (typeof process.env.INPUT_DEBUG !== 'undefined') {
		console.log('::: Commit changes')
		git.status()
	}
	git.commit(options.git.message, options.readmeFile, { '--author': options.git.username }).push()
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
 * @param {*} callback
 * @returns {void}
 */
const updateReadme = function (content, callback) {
	fs.readFile(options.readmeFile, 'utf8', function (err, data) {
		let header = options.show.title ? `*Language experience level (Last update ${new Date().toUTCString()})*\n\n` : '',
			footer = options.show.link ? `\n> My [CodeStats profile](${options.codestats.profile}) in detail.\n` : ''

		if (err) {
			console.log(err)
		}
		let replacement = `<!-- START_SECTION:codestats -->\n${header}\`\`\`text\n${content}\`\`\`\n${footer}<!-- END_SECTION:codestats -->`
		let result = data.replace(
			/((<!--.*START_SECTION:codestats.*-->)([\s\S]+)(<!--.*END_SECTION:codestats.*-->))/g,
			replacement
		)

		fs.writeFile(options.readmeFile, result, 'utf8', function (err) {
			if (err) console.log(err)
			callback()
		})
	})
}

// Init request
request(options.codestats, callback)
