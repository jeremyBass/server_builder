/*jshint node: true*/
module.exports = function(grunt) {
	grunt.registerTask('build_server', 'Building the server', function() {
		//var done = this.async();
		//var nunjucks = require('nunjucks');
		var fs = require('fs');
		var extend = require('extend');

		var merge = require('deepmerge');
		var wrench = require('wrench'),
			util = require('util'),
			spawn = require('child_process').spawn;
		var lastout;
		var default_salt = {};

		function output_stream(sdt_stream,prefix,sufix){
			prefix = prefix||"";
			sufix = sufix||"";
			var out = sdt_stream.toString().trim();
			if( '\n' !== out && null !== out && out!=="" && lastout!==out){
				lastout=out;
				out=out.split('\n\n').join('\n');
				util.print(prefix+out+sufix);
			}
		}


		function run_env(env_obj,log){
			var current_env = env_obj[0];
			env_obj.shift();
			grunt.stdoutlog("run salt env="+current_env,true);
			spawn = require('child_process').spawn;
			var ls = spawn('salt-call', ['--local','--log-level='+(log||'info'),'--config-dir=/etc/salt','state.highstate','env='+current_env],{
					cwd:'/'
				});
			lastout="";
			ls.stdout.on('data', function (data) {
				output_stream(data,'\n');
			});
			ls.stderr.on('data', function (data) {
				output_stream(data,'\n');
			});
			ls.on('exit', function (code) {
				output_stream(code,'\n','<<<<<<<< finished sever "+current_env'+current_env+'\n');
				if(env_obj.length>0){
					run_env(env_obj);
				}
			});
		}
		function create_env( _current_server ){
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
		}
		var _current_server;
		function run_salt_prep(){
			if ( !fs.existsSync('/srv/salt/boot/bootstrap-salt.sh') ) {
				grunt.stdoutlog('/srv/salt/boot/bootstrap-salt.sh missing',true);
			}else{
				grunt.stdoutlog('/srv/salt/boot/bootstrap-salt.sh existed',true);
				grunt.stdoutlog("run salt env base",true);
				spawn = require('child_process').spawn;
				var ls = spawn('sh', ['bootstrap-salt.sh','-K','stable'],{
					cwd:'/srv/salt/boot/'
				});
				grunt.stdoutlog("after spawning call",true);
				lastout="";
				ls.stdout.on('data', function (data) {
					output_stream(data);
				});
				ls.stderr.on('data', function (data) {
					output_stream(data,'\nstderr: ');
				});
				ls.on('exit', function (code) {
					output_stream('child process exited with code ' + code,'\n','\n');
					wrench.mkdirSyncRecursive('/etc/salt/minion.d/', 0777);
					var sourceDir = 'server/salt/deploy_minions/';
					var targetDir = '/etc/salt/minion.d/';
					wrench.copyDirRecursive(sourceDir,targetDir,{
						forceDelete: true
					},function(){
						grunt.stdoutlog(sourceDir+" >> "+targetDir,true);



						var config_file = 'server_project.conf';
						if( fs.existsSync('/server_project.conf') ){
							config_file = '/server_project.conf';
							grunt.stdoutlog("using from root :: "+config_file,true);
						}
						var serverobj = grunt.file.readJSON(config_file);
						var servers = serverobj.servers;

						var log = "error";
						for (var key in servers) {

							_current_server = servers[key];
							_current_server.salt={};
							var env = create_env( _current_server );
							_current_server.salt.env = env;
							var env_obj = [];
							if( "undefined" === typeof _current_server.salt.env.skip_state.base  ){
								env_obj = ['base'];
							}
							for (var app_key in _current_server.apps) {
								if( "undefined" !== typeof _current_server.salt.env.skip_state[app_key]  ){
									var app = _current_server.apps[app_key];
									grunt.stdoutlog("add salt env "+app.install_dir,true);
									env_obj.push(app.install_dir);
								}
							}
							log = _current_server.remote.salt.log_level||_current_server.remote.salt.log_level||"info";
							run_env(env_obj,log);
						}

					});
				});
			}
			grunt.stdoutlog("finished run_salt_prep()",true);
		}


		wrench.mkdirSyncRecursive("/srv/salt", 0777);
		var sourceDir = 'tasks/jigs/salt';
		var targetDir = '/srv/salt';
		grunt.stdoutlog("about to move "+sourceDir+" >> "+targetDir,true);
		wrench.copyDirSyncRecursive(sourceDir,targetDir,{ forceDelete: true });
		grunt.stdoutlog("moved "+sourceDir+" >> "+targetDir,true);
		run_salt_prep();
		//done();
		grunt.task.current.async();
	});
};
