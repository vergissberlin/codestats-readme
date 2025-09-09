/**
 * Mock data for CodeStats API responses
 * Based on the API structure from https://codestats.net/api-docs
 */

// Base mock response matching the actual API structure
const baseMockResponse = {
	dates: {
		"2024-01-01": 1234,
		"2024-01-02": 567,
		"2024-01-03": 890,
		"2023-12-31": 445
	},
	languages: {},
	machines: {
		"dev-machine": {
			new_xps: 0,
			xps: 12345
		}
	},
	new_xp: 0,
	total_xp: 0,
	user: "testuser"
}

// Comprehensive language mock data with realistic XP values
const languagesMockData = {
	"JavaScript": { new_xps: 0, xps: 188377 },
	"TypeScript": { new_xps: 5, xps: 32200 },
	"Python": { new_xps: 10, xps: 16401 },
	"Vue": { new_xps: 0, xps: 143143 },
	"HTML": { new_xps: 0, xps: 137284 },
	"CSS": { new_xps: 0, xps: 19730 },
	"Go": { new_xps: 0, xps: 82348 },
	"C++": { new_xps: 0, xps: 57191 },
	"PHP": { new_xps: 0, xps: 27451 },
	"Markdown": { new_xps: 2, xps: 220306 },
	"YAML": { new_xps: 0, xps: 73315 },
	"Dockerfile": { new_xps: 0, xps: 761 },
	"Shell Script": { new_xps: 0, xps: 25920 },
	"JSON": { new_xps: 0, xps: 39648 },
	"SQL": { new_xps: 0, xps: 360 }
}

// Mock responses for different test scenarios
const mockResponses = {
	// Standard successful response
	success: {
		...baseMockResponse,
		languages: languagesMockData,
		total_xp: Object.values(languagesMockData).reduce((sum, lang) => sum + lang.xps, 0),
		new_xp: Object.values(languagesMockData).reduce((sum, lang) => sum + lang.new_xps, 0)
	},

	// User with no languages (new user)
	emptyUser: {
		...baseMockResponse,
		languages: {},
		total_xp: 0,
		new_xp: 0,
		user: "newuser"
	},

	// User with only one language
	singleLanguage: {
		...baseMockResponse,
		languages: {
			"JavaScript": { new_xps: 50, xps: 1500 }
		},
		total_xp: 1500,
		new_xp: 50,
		user: "singleuser"
	},

	// User with many languages (should be truncated to top 6)
	manyLanguages: {
		...baseMockResponse,
		languages: {
			"JavaScript": { new_xps: 100, xps: 50000 },
			"TypeScript": { new_xps: 80, xps: 40000 },
			"Python": { new_xps: 60, xps: 30000 },
			"Go": { new_xps: 40, xps: 20000 },
			"Java": { new_xps: 30, xps: 15000 },
			"C++": { new_xps: 20, xps: 10000 },
			"Rust": { new_xps: 15, xps: 8000 },
			"PHP": { new_xps: 10, xps: 5000 },
			"Ruby": { new_xps: 5, xps: 2000 },
			"Swift": { new_xps: 2, xps: 1000 }
		},
		total_xp: 181000,
		new_xp: 362,
		user: "polyglot"
	},

	// User with very low XP values
	beginnerUser: {
		...baseMockResponse,
		languages: {
			"Python": { new_xps: 5, xps: 100 },
			"JavaScript": { new_xps: 3, xps: 50 },
			"HTML": { new_xps: 2, xps: 25 }
		},
		total_xp: 175,
		new_xp: 10,
		user: "beginner"
	},

	// User with very high XP values
	expertUser: {
		...baseMockResponse,
		languages: {
			"JavaScript": { new_xps: 1000, xps: 500000 },
			"TypeScript": { new_xps: 800, xps: 400000 },
			"React": { new_xps: 600, xps: 300000 },
			"Vue": { new_xps: 400, xps: 200000 },
			"Node.js": { new_xps: 300, xps: 150000 },
			"Python": { new_xps: 200, xps: 100000 }
		},
		total_xp: 1650000,
		new_xp: 3300,
		user: "expert"
	}
}

// Error responses for testing error handling
const errorResponses = {
	userNotFound: {
		status: 404,
		statusText: 'Not Found',
		body: '{"error": "User not found"}'
	},
	
	serverError: {
		status: 500,
		statusText: 'Internal Server Error',
		body: '{"error": "Internal server error"}'
	},
	
	malformedJson: {
		status: 200,
		statusText: 'OK',
		body: '{"invalid": json malformed'
	},
	
	networkError: new Error('Network request failed')
}

// Function to create a mock fetch response
function createMockResponse(data, status = 200, statusText = 'OK') {
	return {
		ok: status >= 200 && status < 300,
		status,
		statusText,
		text: () => Promise.resolve(typeof data === 'string' ? data : JSON.stringify(data))
	}
}

// Mock fetch implementation for testing
function mockFetch(url, options = {}) {
	// Extract username from URL
	const username = url.match(/\/users\/(.+)$/)?.[1]
	
	if (!username) {
		return Promise.resolve(createMockResponse(errorResponses.userNotFound.body, 404, 'Not Found'))
	}
	
	// Return different responses based on username
	switch (username) {
		case 'testuser':
			return Promise.resolve(createMockResponse(mockResponses.success))
		case 'newuser':
			return Promise.resolve(createMockResponse(mockResponses.emptyUser))
		case 'singleuser':
			return Promise.resolve(createMockResponse(mockResponses.singleLanguage))
		case 'polyglot':
			return Promise.resolve(createMockResponse(mockResponses.manyLanguages))
		case 'beginner':
			return Promise.resolve(createMockResponse(mockResponses.beginnerUser))
		case 'expert':
			return Promise.resolve(createMockResponse(mockResponses.expertUser))
		case 'notfound':
			return Promise.resolve(createMockResponse(errorResponses.userNotFound.body, 404, 'Not Found'))
		case 'servererror':
			return Promise.resolve(createMockResponse(errorResponses.serverError.body, 500, 'Internal Server Error'))
		case 'malformed':
			return Promise.resolve(createMockResponse(errorResponses.malformedJson.body, 200, 'OK'))
		case 'networkerror':
			return Promise.reject(errorResponses.networkError)
		default:
			return Promise.resolve(createMockResponse(mockResponses.success))
	}
}

module.exports = {
	mockResponses,
	errorResponses,
	languagesMockData,
	createMockResponse,
	mockFetch
}
