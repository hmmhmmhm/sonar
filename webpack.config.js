const path = require('path')

var config = {
	entry: './sonar.js',
	mode: 'production',
	devtool: 'none',
	target: 'web',
	output: {
		filename: 'sonar.js',
		path: path.resolve(__dirname, 'build'),
		publicPath: './',

		library: 'SONAR',
		libraryTarget: 'this',
		libraryExport: 'default'
	},

	plugins: [],

	module: {
		unsafeCache: true,
		rules: [{
			test: /\.js$/,
			include: path.join(__dirname),
			exclude: /(node_modules)|(dist)/,
			use: {
				loader: 'babel-loader',
				query: {
					presets: ['@babel/preset-env'],
					plugins: []
				}
			}
		}]
	},

	optimization: {
		minimize: false
	},

	node: {
		console: false,

		global: true,
		process: true,
		setImmediate: false,
	
		path: true,
		url: false,

		Buffer: true,
		__filename: false,
    	__dirname: false,

		fs: 'empty',
		net: 'empty',
		dns: 'empty',
		dgram: 'empty',
		tls: 'empty'
	}
}

module.exports = [config]