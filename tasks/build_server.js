/*jshint node: true*/
module.exports = function(grunt) {
	grunt.registerTask('build_server', 'Building the server', function() {
		//var done = this.async();
		//var nunjucks = require('nunjucks');
		var fs = require('fs');
		//var extend = require('extend');

		//var merge = require('deepmerge');
		var wrench = require('wrench'),
			//util = require('util'),
			spawn = require('child_process').spawn;



		function run_env(env_obj,log){
			var current_env = env_obj[0];
			env_obj.shift();
			grunt.stdoutlog("run salt env="+current_env,true);
			spawn = require('child_process').spawn;
			var ls = spawn('salt-call', ['--local','--log-level='+(log||'info'),'--config-dir=/etc/salt','state.highstate','env='+current_env],{
					cwd:'/'
				});
			grunt.lastout="";
			ls.stdout.on('data', function (data) {
				grunt.output_stream(data,'\n');
			});
			ls.stderr.on('data', function (data) {
				grunt.output_stream(data,'\n');
			});
			ls.on('exit', function (code) {
				grunt.output_stream(code,'\n','<<<<<<<< finished sever "+current_env'+current_env+'\n');
				if(env_obj.length>0){
					run_env(env_obj);
				}
			});
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
				grunt.lastout="";
				ls.stdout.on('data', function (data) {
					grunt.output_stream(data);
				});
				ls.stderr.on('data', function (data) {
					grunt.output_stream(data,'\nstderr: ');
				});
				ls.on('exit', function (code) {
					grunt.output_stream('child process exited with code ' + code,'\n','\n');
					wrench.mkdirSyncRecursive('/etc/salt/minion.d/', 0777);
					var sourceDir = 'server/salt/deploy_minions/';
					var targetDir = '/etc/salt/minion.d/';
					wrench.copyDirRecursive(sourceDir,targetDir,{
						forceDelete: true
					},function(){
						grunt.stdoutlog(sourceDir+" >> "+targetDir,true);

						var serverobj = grunt.create_env_tmp();
						//var serverobj = grunt.load_server_config();
						var servers = serverobj.servers;

						var log = "error";
						for (var key in servers) {

							_current_server = servers[key];
							/*_current_server.salt={};
							var env = grunt.create_env( _current_server );
							_current_server.salt.env = env;*/
							var env_obj = [];
							if( "undefined" === typeof _current_server.env.salt.skip_state.base  ){
								env_obj = ['base'];
							}
							for (var app_key in _current_server.apps) {
								if( "undefined" !== typeof _current_server.env.salt.skip_state[app_key]  ){
									var app = _current_server.apps[app_key];
									grunt.stdoutlog("add salt env "+app.install_dir,true);
									env_obj.push(app.install_dir);
								}
							}
							log = _current_server.env.salt.log_level||"info";
							grunt.stdoutlog("run_env on env_obj:", true, true);
							grunt.stdoutlog(env_obj, true, true);
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
