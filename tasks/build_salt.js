/* 
 * Location: within the server itself
 * State: bare
*/
module.exports = function(grunt) {
	grunt.registerTask('build_salt', 'Setting up the salt provisioner', function() {
		//var done = this.async();
		var nunjucks = require('nunjucks');
		var path = require('path');
		var fs = require('fs'),
			fsx = require('fs-extra');
		var extend = require('extend');
		var wrench = require('wrench'),
			util = require('util');
		var merge = require('deepmerge');
		var lastout;
		var glob = require("glob");

		function output_stream(sdt_stream,prefix,sufix){
			prefix = prefix||"";
			sufix = sufix||"";
			var out = sdt_stream.toString().trim();
			if( out!='\n' && out!=null && out!="" && lastout!=out){
				lastout=out;
				out=out.split('\n\n').join('\n');
				util.print(prefix+out+sufix);
			}
		}

		var nenv = new nunjucks.Environment();
		nenv.addFilter("leadingzero", function(int, zerocount) {
			var base="";
			var count = zerocount||(int+"").length;
			for (i = 0; i < count; i++) { 
				base += "0";
			}
			var charLength=(base.length - (int+"").length);
			return (base.substring(0, charLength))+int+"";
		});
		
		
		wrench.mkdirSyncRecursive("server/salt", 0777);
		var sourceDir = path.resolve('tasks/jigs/salt');
		var targetDir = path.resolve('server/salt');
		/*wrench.copyDirSyncRecursive(sourceDir,targetDir,{
			forceDelete: true
		});*/
		grunt.log.writeln("copy " + sourceDir);
		grunt.log.writeln("to " + targetDir);
		fsx.copy( sourceDir, targetDir, {"clobber" :true}, function (err) {
			if (err) return grunt.log.writeln(err);
		});
		
		grunt.log.writeln("building the salt minions");
		
		wrench.mkdirSyncRecursive("server/salt/deploy_minions", 0777);
		var default_salt = {
			
		};
		var config_file = 'server_project.conf';
		if( fs.existsSync('/server_project.conf') ){
			config_file = '/server_project.conf';
			grunt.log.writeln("using from root :: "+config_file);
		}
		serverobj = grunt.file.readJSON(config_file);
		var servers = serverobj.servers;
		

		function load_apps(app_obj,callback){
			if(app_obj === false){
				app_obj=[];
				grunt.log.writeln("needed app_obj ");
				for (var key in servers) {
					grunt.log.writeln("adding "+key+" to app_obj");
					var server = servers[key];
					for (var app_key in server.apps) {
						var app = server.apps[app_key];
						var app_op={};
						if(app.repo){
							app_op["repo"]=app.repo;
						}
						if(app.branch){
							app_op["branch"]=app.branch;
						}
						if(app.tag){
							app_op["tag"]=app.tag;
						}
						if(app.install_dir){
							app_op["install_dir"]=app.install_dir;
						}
						app_obj.push(app_op);
					}
				}
			}
			if(app_obj.length>0){
				var _app_op = app_obj[0];
				app_obj.shift();

				var spawn = require('child_process').spawn;
				var gitArg = [];
				if( grunt.fileExist('/var/app/'+_app_op.install_dir+'/.git/config'){ //fs.exists('/var/app/'+_app_op.install_dir+'/.git/'config) ){
					console.log('/var/app/'+_app_op.install_dir+'/.git/config !! existed !!' );
					gitArg.push(" up ");
				}else{
					console.log('/var/app/'+_app_op.install_dir+'/.git/config !! DID NOT exist :/ ' );
				}
				if(_app_op.install_dir){
					/*gitArg.push(" -p ");
					gitArg.push("/var/app/"+_app_op.install_dir+"/ ");*/
					gitArg.push(" -p /var/app/" + _app_op.install_dir + "/ ");
				}
				if(_app_op.branch){
					/*gitArg.push(" -b ");
					gitArg.push(_app_op.branch);*/
					gitArg.push(" -b " + _app_op.branch + " ");
				}
				if(_app_op.tag){
					/*gitArg.push(" -t ");
					gitArg.push(_app_op.tag);*/
					gitArg.push(" -t " + _app_op.tag + " ");
				}
				if(_app_op.install_dir){ // tracked name
					gitArg.push(" " + _app_op.install_dir + " ");
				}
				if(_app_op.repo){
					gitArg.push(" " + _app_op.repo);
				}
				grunt.stdoutlog("gitploy "+_app_op.install_dir);
				grunt.stdoutlog("gitArg: "+gitArg+" \n"); //need to match ("gitArg: %j \n", gitArg)
				grunt.stdoutlog("cwd: gitploy" + gitArg.join(' ') + " \n");
				
				/*grunt.log.writeln("gitploy "+_app_op.install_dir);
				console.log("gitArg: %j \n", gitArg);
				console.log("cwd: %s \n", 'gitploy '+gitArg.join(' '));*/
				/*var ls = spawn('gitploy', gitArg,{
					cwd:'/'
				});*/
				
				var spawnCommand = require('spawn-command'),
				    ls = spawnCommand('cd / && gitploy '+gitArg.join(' '));
				
				var lastout;
				ls.stdout.on('data', function (data) {
					output_stream(data,'\n');
				});
				ls.stderr.on('data', function (data) {
					output_stream(data,'\n');
				});
				ls.on('exit', function (code) {
					output_stream(code,'\n','<<<<<<<< finished sever '+_app_op.install_dir+'\n');
					if(app_obj.length>0){
						load_apps(app_obj,callback);
					}else{
						grunt.log.writeln("Finished app downloads");
						if(typeof callback === "function"){
							callback(); //we just finished the last one exit out
						}
					}
				});
			}else{
				grunt.log.writeln("failed to load app_obj and started exit -- no apps loaded");
				if(typeof callback === "function"){
					callback(); //the was an empty box this step was called with, exit out
				}
			}
		}

		function start_salt_production(){
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



				var remote_pillars = typeof(server.remote.salt)!=="undefined"?server.remote.salt.pillars:[];
				var vagrant_pillars = typeof(server.vagrant.salt)!=="undefined"?server.vagrant.salt.pillars:[];
				var app_pillars = [];
				for (var app_key in server.apps) {
					var app = server.apps[app_key];
					if(typeof(app["remote"]["salt"])!=="undefined"){
						if(typeof(app["remote"]["salt"]["pillars"])!=="undefined"){
							app_pillars = merge(app_pillars,app.remote.salt.pillars);
						}
					}
					if(typeof(app["vagrant"]["salt"])!=="undefined"){
						if(typeof(app["vagrant"]["salt"]["pillars"])!=="undefined"){
							app_pillars = merge(app_pillars,app.vagrant.salt.pillars);
						}
					}
				}
				//console.log("app_pillars: %j", app_pillars);
				var pillars = merge(merge(remote_pillars, vagrant_pillars),app_pillars);
				server.salt.pillars=pillars;
				//console.log("_pillars: %j", pillars);

				for (var app_key in server.apps) {
					var app = server.apps[app_key];
					// options is optional
					glob("/var/app/"+app.install_dir+"/provision/salt/pillar/_pillar-jigs/*.sls", {}, function (er, files) {
						for (var file in files) {
							var item = files[file].split('/').pop();
							//grunt.log.writeln(item+"\r");
							grunt.log.writeln(item+" -item for\r");
							grunt.log.writeln(app.install_dir+" -item for\r");
							var sourceFile = "/var/app/"+app.install_dir+"/provision/salt/pillar/_pillar-jigs/"+item;
							var targetFile = '/var/app/'+app.install_dir+'/provision/salt/pillar/'+item;
							var content = fs.readFileSync(sourceFile,'utf8');

							//grunt.log.writeln("read file");
							//grunt.log.writeln("renderString of file");
							var tmpl = new nunjucks.Template(content,nenv);
							//grunt.log.writeln("compile");
							var res = tmpl.render(server.salt);
							grunt.log.writeln("renderd pillar ---"+item+"--- for "+app.install_dir);
							fs.writeFile(targetFile, res, function(err){
								//grunt.log.writeln("wrote to file");
							});
						}
					})
				}

				grunt.log.writeln("extenting server salt for "+key);
				grunt.log.writeln("minion "+server.salt.minion);
				var sourceFile = 'tasks/jigs/salt/minions/_template.conf';
				var targetFile = 'server/salt/deploy_minions/'+ server.salt.minion +'.conf';
				var content = fs.readFileSync(sourceFile,'utf8')

				//grunt.log.writeln("read file");
				//grunt.log.writeln("renderString of file");
				var tmpl = new nunjucks.Template(content);
				//grunt.log.writeln("compile");
				var res = tmpl.render(server);
				grunt.log.writeln("renderd");
				fs.writeFile(targetFile, res, function(err){
					//grunt.log.writeln("wrote to file");
				});

			}
		}
		load_apps(false,start_salt_production);
		
		//done();
		grunt.task.current.async();
	});
};