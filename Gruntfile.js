
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
	var wrench = require('wrench');
	var util = require('util');
	
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

	function getDateTime() {
		var date = new Date();

		var hour = date.getHours();
		hour = (hour < 10 ? "0" : "") + hour;

		var min  = date.getMinutes();
		min = (min < 10 ? "0" : "") + min;

		
		var year = date.getFullYear();

		var month = date.getMonth() + 1;
		month = (month < 10 ? "0" : "") + month;

		var day  = date.getDate();
		day = (day < 10 ? "0" : "") + day;

		return hour + '_' + min +'--' + day + '-' + month + '-'+year;
	}
	wrench.mkdirSyncRecursive("/grunts", 0777);
	grunt.logFile = '/grunts/'+getDateTime()+'--node-serverbuilder-log.txt';
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
			var util = require('util');

			if( "string" !== typeof content ){
				content = util.inspect(content, false, null);
			}else{
				content = content.split('\n\n').join('\n');
			}

			fs.appendFile( grunt.logFile, content +'\n', 'utf8', function (err) {
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
		var file = corePath.resolve( filepath );
		try {
			grunt.stdoutlog("checking for :: "+file,true);
			return fs.statSync( file ).isDirectory() || fs.statSync( file ).isFile();
		}
		catch (err) {
			grunt.stdoutlog(err,true);
			grunt.stdoutlog("failed check for :: "+file,true);
			return false;
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
