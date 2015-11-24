
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

	/*
	 * Writes to a log file and to the console as needed.
	 * @content mixed (string,object,boolean)
	 */
	grunt.stdoutlog = function( content, logtofile ){
		logtofile = logtofile || false;
		var stdout = function( content ){
			if( "string" === typeof content ){
				grunt.log.writeln( content );
			}else{
				console.log( content );
			}
		};
		var bakeIt = function( content, callback ){
			var fs = require('fs');
			fs.appendFile('/log.txt', content.split('\n\n').join('\n') +'\n', encoding='utf8', function (err) {
				if( err ){
					throw err;
				}
				callback( content );
			});
		};
		if( true !== logtofile ){
			bakeIt( content, stdout );
		}else{
			stdout( content );
		}
	};

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
