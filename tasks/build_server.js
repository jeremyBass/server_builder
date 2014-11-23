module.exports = function(grunt) {
	grunt.registerTask('build_server', 'Building the server', function() {
		grunt.log.writeln("Would start building the sever");
		
		var nunjucks = require('nunjucks');
		var fs = require('fs');
		var extend = require('extend');
		var wrench = require('wrench'),
			util = require('util'),
			spawn = require('child_process').spawn;




		function run_env(env_obj){
			var current_env = env_obj[0];
			env_obj.shift();
			ls    = spawn('salt-call', ['--local','--log-level=info','--config-dir=/etc/salt','state.highstate','env='+current_env]);
			var lastout;
			ls.stdout.on('data', function (data) {
				var out = data.toString().trim();
				if( out!='\n' && out!=null && out!="" && lastout!=out){
					lastout=out;
					console.log(out);
				}
			});
			ls.stderr.on('data', function (data) {
			  console.log('stderr: ' + data);
			});
			ls.on('exit', function (code) {
				console.log('child process exited with code ' + code);
				grunt.log.writeln("<<<<<<<< finished sever "+current_env);

				if(env_obj.length>0){
					run_env(env_obj);
				}
			});
		}

		function run_salt_prep(){

			grunt.log.writeln("run salt env base");
			ls    = spawn('sh', ['/srv/salt/boot/bootstrap-salt.sh','-K','stable']);
			var lastout;
			ls.stdout.on('data', function (data) {
				var out = data.toString().trim();
				if( out!='\n' && out!=null && out!="" && lastout!=out){
					lastout=out;
					console.log(out);
				}
			});
			ls.stderr.on('data', function (data) {
			  console.log('stderr: ' + data);
			});
			ls.on('exit', function (code) {
			  console.log('child process exited with code ' + code);
			});
			
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
						grunt.log.writeln("add salt env "+app_key);
						env_obj.push(app_key);
					}
				}
				run_env(env_obj);
			});
		}



		if (!fs.existsSync("/srv/salt")) {
			fs.mkdir("/srv/salt", 0777, true, function (err) {
				if (err) {
					grunt.log.writeln("failed to make folder server");
				} else {
					grunt.log.writeln("made folder server");
				}
			});
		}
		var sourceDir = 'tasks/jigs/salt';
		var targetDir = '/srv/salt';
		grunt.log.writeln("about to move "+sourceDir+" >> "+targetDir);
		wrench.copyDirRecursive(sourceDir,targetDir,{ forceDelete: true });
		run_salt_prep();

		
		
	});
};