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

/**
 * Create options from environment variables
 */
function createOptions() {
	// Validate environment variables
	if (typeof process.env.INPUT_CODESTATS_USERNAME == 'undefined')
		throw new Error('InvalidArgumentExcpetion – The CODESTATS_USERNAME has to be set!')

	return {
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
}

// Lazily created options used by runtime start()
let options = null

/**
 * Request callback
 *
 * @param {*} error
 * @param {*} response
 * @param {*} body
 */
const makeCallback = function (opts) {
	return function (error, response, body) {
		if (!error && response.statusCode == 200) {
			const languages = Object.entries(JSON.parse(body).languages)
			const updateReadmeForOpts = makeUpdateReadme(opts)
			const commitChangesForOpts = makeCommitChanges(opts)
			updateReadmeForOpts(buildChart(languages, opts.graph.width), commitChangesForOpts)
		}
	}
}

/**
 * Commit changes in README file
 */
const makeCommitChanges = function (opts) {
	return function () {
		const git = simpleGit()
		if (typeof process.env.INPUT_DEBUG !== 'undefined') {
			console.log('::: Commit changes')
			git.status()
		}
		git.commit(opts.git.message, opts.readmeFile, { '--author': opts.git.username }).push()
	}
}

/**
 * Build chart with data
 *
 * @param {Array} data
 * @param {number} width
 * @returns {String}
 */
const buildChart = function (data, width = 42) {
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
	return bars(languageChart, { bar: '█', width })
}

/**
 * Replace the codestats section in markdown content
 *
 * @param {string} markdown
 * @param {string} content
 * @param {string} header
 * @param {string} footer
 * @returns {string}
 */
const replaceCodestatsSection = function (markdown, content, header = '', footer = '') {
	const replacement = `<!-- START_SECTION:codestats -->\n${header}\`\`\`text\n${content}\`\`\`\n${footer}<!-- END_SECTION:codestats -->`
	return markdown.replace(
		/((<!--.*START_SECTION:codestats.*-->)([\s\S]+)(<!--.*END_SECTION:codestats.*-->))/g,
		replacement
	)
}

/**
 * Update the content of readme file
 *
 * @param {*} content
 * @param {*} callback
 * @returns {void}
 */
const makeUpdateReadme = function (opts) {
	return function (content, callback) {
		fs.readFile(opts.readmeFile, 'utf8', function (err, data) {
			let header = opts.show.title ? `*Language experience level (Last update ${new Date().toUTCString()})*\n\n` : '',
				footer = opts.show.link ? `\n> My [CodeStats profile](${opts.codestats.profile}) in detail.\n` : ''

			if (err) {
				console.log(err)
			}
			const result = replaceCodestatsSection(data, content, header, footer)

			fs.writeFile(opts.readmeFile, result, 'utf8', function (err) {
				if (err) console.log(err)
				callback()
			})
		})
	}
}

/**
 * Start the action if called directly
 */
function start() {
	const opts = createOptions()
	const callback = makeCallback(opts)
	request(opts.codestats, callback)
}

// Export functions for testing
module.exports = {
	buildChart,
	replaceCodestatsSection,
	createOptions,
	makeCallback,
	makeUpdateReadme,
	makeCommitChanges,
	start
}

// Init request if called directly
if (require.main === module) {
	start()
}
