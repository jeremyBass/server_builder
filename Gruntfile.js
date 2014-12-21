
module.exports = function(grunt) {
	//lets look for configs
	function loadConfig(path) {
	  var glob = require('glob');

	  var object = {};
	  var key;

	  glob.sync('*', {cwd: path}).forEach(function(option) {
		key = option.replace(/\.js$/,'');
		object[key] = require(path + option);
	  });

	  return object;
	}

	var pkg,setbase,config;

	pkg = grunt.file.readJSON('package.json');
	setbase = grunt.option('setbase') || pkg.build_location+'/'+pkg.build_version+'/';

	config = {
		pkg: pkg,
		setbase:setbase,
		config: {
			build: 'build'
		}
	};
 
	grunt.util._.extend(config, loadConfig('./tasks/options/'));
	grunt.initConfig(config);

	require('load-grunt-tasks')(grunt);
	grunt.loadTasks('tasks');
	
	// Default task(s).
	grunt.registerTask('default', ['jshint']);

	grunt.registerTask('prod', [
		'env:prod',
		'build'
	]);

	grunt.registerTask('dev', [
		'jshint',
		'env:dev',
		'build'
	]);

};
