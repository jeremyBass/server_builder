/* 
 * Location: within the server itself
 * State: bare
*/
module.exports = function(grunt) {
	grunt.registerTask('build_salt', 'Setting up the salt provisioner', function() {
		function cmd_exec(cmd, args, cb_stdout, cb_end) {
			var spawn = require('child_process').spawn,
				child = spawn(cmd, args),
				me = this;
			me.exit = 0;  // Send a cb to set 1 when cmd exits
			child.stdout.on('data', function (data) { cb_stdout(me, data) });
			child.stdout.on('end', function () { cb_end(me) });
		}
		
		var nunjucks = require('nunjucks');
		var fs = require('fs');
		var extend = require('extend');
		var wrench = require('wrench'),
			util = require('util');
		var merge = require('deepmerge')


		wrench.mkdirSyncRecursive("server/salt", 0777);
		var sourceDir = 'tasks/jigs/salt';
		var targetDir = 'server/salt';
		wrench.copyDirSyncRecursive(sourceDir,targetDir,{
			forceDelete: true
		});
		grunt.log.writeln("building the salt minions");
		
		wrench.mkdirSyncRecursive("server/salt/deploy_minions", 0777);
		var default_salt = {
			
		};
		serverobj = grunt.file.readJSON('server_project.conf');
		var servers = serverobj.servers;
		//set up the vagrant object so that we can just define the server if we want to
		//the vagrant needs some defaults, and so it's vagrant default then remote then 
		//vagrant opptions
		for (var key in servers) {
			grunt.log.writeln("found server salt "+key);
			var server = servers[key];
			server.salt={};
			
			var remote_env = typeof(server.remote.salt)!=="undefined"?server.remote.salt.env:[];
			var vagrant_env = typeof(server.vagrant.salt)!=="undefined"?server.vagrant.salt.env:[];
			var app_env = [];
			for (var app_key in server.apps) {
				var app = server.apps[app_key];
				if(typeof(app["salt"])!=="undefined"){
					if(typeof(app["salt"]["env"])!=="undefined"){
						app_env = merge(app_env,app.salt.env);
					}
				}
			}

			server.salt = extend(default_salt,server.remote.salt,server.vagrant.salt||{});

			var env = merge(merge(remote_env, vagrant_env),app_env);
			var _env = [];
			env.forEach(function(entry) {
				//grunt.log.writeln("looking at env "+entry);
				if(entry.indexOf('-') == 0){
					var _entry = entry.substring(1);
					//grunt.log.writeln("checking for "+_entry);
					var exc = _env.indexOf(_entry);
					//grunt.log.writeln(_entry+" has index at "+exc);
					if( exc > -1){
						_env.splice(exc, 1);
					}
				}else{
					if(_env.indexOf(entry) == -1){
						_env.push(entry);
					}
				}
			});
			server.salt.env=_env;
			/*_env.forEach(function(entry) {
				grunt.log.writeln("env has "+entry);
			});*/
			grunt.log.writeln("extenting server salt for "+key);
			grunt.log.writeln("minion "+server.salt.minion);
			var sourceFile = 'tasks/jigs/salt/minions/_template.conf';
			var targetFile = 'server/salt/deploy_minions/'+ server.salt.minion +'.conf';
			var content = fs.readFileSync(sourceFile,'utf8')

			grunt.log.writeln("read file");
			grunt.log.writeln("renderString of file");
			var tmpl = new nunjucks.Template(content);
			grunt.log.writeln("compile");
			var res = tmpl.render(server);
			grunt.log.writeln("renderd");
			fs.writeFile(targetFile, res, function(err){
				grunt.log.writeln("wrote to file");
			});

		}

		grunt.task.current.async();
	});
};