/*jslint node: true*/

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
	var extend = require('extend');

	var merge = require('deepmerge');var default_salt = {};
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
	var time = "";
	function setFileTime(){
		time = getDateTime();
	}
	setFileTime();
	wrench.mkdirSyncRecursive("/grunts", 0777);
	grunt.logFile = '/grunts/'+time+'--node-serverbuilder-log.txt';
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
			var _content = content;
			if( "string" !== typeof _content ){
				_content = util.inspect(_content, false, null);
			}else{
				_content = content.split('\n\n').join('\n');
			}

			fs.appendFile( grunt.logFile, _content +'\n', 'utf8', function (err) {
				if( err ){
					stdout( err );
					throw err;
				}
				if( "function" === typeof callback ){
					callback( content );
				}
			});
		};
		if( true === log_to_file || true === file_only ){
			bakeIt( content, true !== file_only ? stdout : null );
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

	grunt.create_env = function( _current_server ){
		var remote_env  = "undefined" !== typeof _current_server.remote.salt ? _current_server.remote.salt.env : [ ];
		var vagrant_env = "undefined" !== typeof _current_server.vagrant.salt ? _current_server.vagrant.salt.env : [ ];
		var app_env = [];
		for (var app_key in _current_server.apps) {
			var app = _current_server.apps[app_key];
			if( "undefined" !== typeof app.salt ){
				if( "undefined" !== typeof app.salt.env ){
					app_env = merge(app_env,app.salt.env);
				}
			}
		}

		_current_server.salt = extend(default_salt,_current_server.remote.salt,_current_server.vagrant.salt||{});

		var env = merge(merge(remote_env, vagrant_env),app_env);
		var _env = [];
		env.forEach(function(entry) {
			//grunt.stdoutlog("looking at env "+entry,true);
			if( 0 === entry.indexOf('-') ){
				var _entry = entry.substring(1);
				//grunt.stdoutlog("checking for "+_entry,true);
				var exc = _env.indexOf(_entry);
				//grunt.stdoutlog(_entry+" has index at "+exc,true);
				if( exc > -1){
					_env.splice(exc, 1);
				}
			}else{
				if( -1 === _env.indexOf(entry) ){
					_env.push(entry);
				}
			}
		});
		return _env;
	};

	grunt.load_server_config = function( config_path ){
		var config_file = config_path||'server_project.conf';
		if( fs.existsSync('/server_project.conf') ){
			config_file = '/server_project.conf';
			grunt.stdoutlog("using from root :: "+config_file,true);
		}
		var serverobj = grunt.file.readJSON(config_file);
		return serverobj;
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
