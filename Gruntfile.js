
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

	var pkg,setbase,config,
		corePath = require('path'),
		fs = require('fs');
	
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
	 * @ content [mixed] (string,object,boolean)
	 * @ log_to_file [boolean] append to log file
	 * @ file_only [boolean] don't send to stdout/stderr
	 */
	grunt.stdoutlog = function( content, log_to_file, file_only ){
		log_to_file = log_to_file || false;
		file_only = file_only || false;
		var stdout = function( content ){
			if( "string" === typeof content ){
				grunt.log.writeln( content );
			}else{
				console.log( content );
			}
		};
		var bakeIt = function( content, callback ){
			var fs = require('fs');
			fs.appendFile('/node-serverbuilder-log.txt', content.split('\n\n').join('\n') +'\n', 'utf8', function (err) {
				if( err ){
					stdout( err );
					throw err;
				}
				if( "function" === typeof content ){
					callback( content );
				}
			});
		};
		if( true === log_to_file || true === file_only ){
			bakeIt( content, true !== file_only ? stdout : false );
		}
		if( true !== file_only ){
			stdout( content );
		}
	};

	
	grunt.fileExist = function( filepath ){
		fs.open( corePath.resolve( filepath ) , 'r', function(err, fd) {
			if( err ){
				grunt.log.writeln(err);
				return false;
			}
		});
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
