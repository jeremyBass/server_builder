module.exports = function(grunt) {
	grunt.registerTask('build_server', 'Building the server', function() {
		var done = this.async();
		var nunjucks = require('nunjucks');
		var fs = require('fs');
		var extend = require('extend');
		var wrench = require('wrench'),
			util = require('util'),
			spawn = require('child_process').spawn;
		var lastout;
		
		function output_stream(sdt_stream,prefix,sufix){
			prefix = prefix||"";
			sufix = sufix||"";
			var out = sdt_stream.toString().trim();
			if( out!='\n' && out!=null && out!="" && lastout!=out){
				lastout=out;
				util.print(prefix+out+sufix);
			}
		}


		function run_env(env_obj){
			var current_env = env_obj[0];
			env_obj.shift();
			grunt.log.writeln("run salt env="+current_env);
			spawn = require('child_process').spawn;
			var ls = spawn('salt-call', ['--local','--log-level=info','--config-dir=/etc/salt','state.highstate','env='+current_env],{
					cwd:'/'
				});
			var lastout;
			ls.stdout.on('data', function (data) {
				output_stream(data);
			});
			ls.stderr.on('data', function (data) {
				output_stream(data,'\rstderr: ');
			});
			ls.on('exit', function (code) {
				output_stream(code,'','<<<<<<<< finished sever "+current_env'+current_env+'\r');
				if(env_obj.length>0){
					run_env(env_obj);
				}
			});
		}

		function run_salt_prep(){
			if (!fs.existsSync('/srv/salt/boot/bootstrap-salt.sh')) {
				grunt.log.writeln('/srv/salt/boot/bootstrap-salt.sh missing');
			}else{
				grunt.log.writeln('/srv/salt/boot/bootstrap-salt.sh existed');
				grunt.log.writeln("run salt env base");
				spawn = require('child_process').spawn;
				var ls = spawn('sh', ['bootstrap-salt.sh','-K','stable'],{
					cwd:'/srv/salt/boot/'
				});
				grunt.log.writeln("after spawning call");
				var lastout;
				ls.stdout.on('data', function (data) {
					output_stream(data);
				});
				ls.stderr.on('data', function (data) {
					output_stream(data,'\rstderr: ');
				});
				ls.on('exit', function (code) {
					output_stream('child process exited with code ' + code,'\r','\r');
					wrench.mkdirSyncRecursive('/etc/salt/minion.d/', 0777);
					var sourceDir = 'server/salt/deploy_minions/';
					var targetDir = '/etc/salt/minion.d/';
					wrench.copyDirRecursive(sourceDir,targetDir,{
						forceDelete: true
					},function(){
						grunt.log.writeln(sourceDir+" >> "+targetDir);

						var env_obj = ['base'];
						serverobj = grunt.file.readJSON('server_project.conf');
						var servers = serverobj.servers;
						for (var key in servers) {
							var server = servers[key];
							for (var app_key in server.apps) {
								var app = server.apps[app_key];
								grunt.log.writeln("add salt env "+app.install_dir);
								env_obj.push(app.install_dir);
							}
						}
						run_env(env_obj);
					});
				});
				}
			grunt.log.writeln("finished run_salt_prep()");
		}


		wrench.mkdirSyncRecursive("/srv/salt", 0777);
		var sourceDir = 'tasks/jigs/salt';
		var targetDir = '/srv/salt';
		grunt.log.writeln("about to move "+sourceDir+" >> "+targetDir);
		wrench.copyDirSyncRecursive(sourceDir,targetDir,{ forceDelete: true });
		grunt.log.writeln("moved "+sourceDir+" >> "+targetDir);
		run_salt_prep();
		
			
		
		done();
	});
};