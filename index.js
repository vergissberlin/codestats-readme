const bars = require('bars'),
	fs = require('fs'),
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
			username: process.env.GITHUB_ACTOR ? String(process.env.GITHUB_ACTOR) : 'CodeStats bot',
			message: process.env.INPUT_COMMIT_MESSAGE ? String(process.env.INPUT_COMMIT_MESSAGE) : 'Update codestats metrics',
			token: process.env.INPUT_GITHUB_TOKEN ? String(process.env.INPUT_GITHUB_TOKEN) : ''
		},
		graph: {
			width: Number(process.env.INPUT_GRAPH_WIDTH) || 42
		},
		readmeFile: process.env.INPUT_README_FILE ? String(process.env.INPUT_README_FILE) : './README.md',
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

	// Filter out invalid entries and ensure numeric xps values
	const validData = data.filter(([key, value]) => {
		return key && 
			value && 
			typeof value === 'object' && 
			typeof value.xps === 'number' && 
			value.xps >= 0 && 
			isFinite(value.xps)
	})

	// Return empty string if no valid data
	if (validData.length === 0) {
		return ''
	}

	validData.sort(function (a, b) {
		return b[1].xps - a[1].xps
	})
	const topLanguages = validData.slice(0, 6)
	topLanguages.forEach(([key, value]) => {
		languageChart = Object.assign(languageChart, {
			[key]: value.xps
		})
	})
	
	// Handle empty chart case
	if (Object.keys(languageChart).length === 0) {
		return ''
	}
	
	try {
		return bars(languageChart, { bar: '█', width })
	} catch (error) {
		// If bars library fails, return empty string
		console.error('Chart generation failed:', error)
		return ''
	}
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
	// Ensure all parameters are strings
	if (typeof markdown !== 'string') {
		console.error('replaceCodestatsSection: markdown must be a string')
		return ''
	}
	if (typeof content !== 'string') content = ''
	if (typeof header !== 'string') header = ''
	if (typeof footer !== 'string') footer = ''
	
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
async function start() {
	const opts = createOptions()
	const callback = makeCallback(opts)
	
	try {
		const response = await fetch(opts.codestats.url)
		if (response.ok) {
			const body = await response.text()
			callback(null, { statusCode: response.status }, body)
		} else {
			callback(new Error(`HTTP ${response.status}: ${response.statusText}`), response, null)
		}
	} catch (error) {
		callback(error, null, null)
	}
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
