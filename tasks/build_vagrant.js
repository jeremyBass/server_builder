module.exports = function(grunt) {
	grunt.registerTask('build_vagrant', 'Setting up Vagrant and then building the server', function() {
		//var done = this.async();
		var nunjucks = require('nunjucks');
		var fs = require('fs');
		var extend = require('extend');
		var wrench = require('wrench'),
			util = require('util'),
			spawn = require('child_process').spawn;
		var ip,_ip="10.255.255.2";
		var lastout;
		/*come back to this.
		function ip_inuse(_ip){
			var Ping = require('ping-wrapper');
			Ping.configure();

			var pings=false;
			var ping = new Ping('127.0.0.1');
			ping.on('ping', function(data){pings=true});

			return pings;
		}
		
		for(var i=2,n=255;i<n;i+=1) {
			 _ip="10.255.255."+i;
			if(ip_inuse(_ip)){
				continue;
			}else{
				ip=_ip;
				break;
			}
		}*/
		
		function output_stream(sdt_stream,prefix,sufix){
			prefix = prefix||"";
			sufix = sufix||"";
			var out = sdt_stream.toString().trim();
			if( out!='\n' && out!=null && out!="" && lastout!=out){
				lastout=out;
				util.print(prefix+out+sufix);
			}
		}
		
		var plugins="";
		function check_vagrant_plugins(plugin,callback){
			if(plugins==""){
				spawn = require('child_process').spawn;
				var command = spawn('vagrant', ['plugin','list']);
				var lastout;
				var result = '';
				command.stdout.on('data', function (data) {
					result += data.toString();
				});
				command.on('exit', function (code) {
					plugins=result;
					var patt = new RegExp((plugin.split('-').join('\-'))+" ");
					callback(patt.test(plugins));
				});
			}else{
				var patt = new RegExp((plugin.split('-').join('\-'))+" ");
				callback(patt.test(plugins));
			}
		}
		function next_plugin(plugins){
			if(plugins.length>0){
				normalize_vagrant_plugins(plugins);
			}
		}
		function normalize_vagrant_plugins(plugins){
			var plugin = plugins[0].toString();
			plugins.shift();
			check_vagrant_plugins(plugin,function(resulting){
				if(resulting==false){
					grunt.log.writeln("\r"+plugin+" is NOT installed");
					spawn = require('child_process').spawn;
					var ls = spawn('vagrant', ['plugin','install',plugin]);
					var lastout;
					ls.stdout.on('data', function (data) {
						output_stream(data);
					});
					ls.stderr.on('data', function (data) {
						output_stream(data,'\rstderr: ');
					});
					ls.on('exit', function (code) {
						grunt.log.writeln("\rinstalled "+plugin);
						next_plugin(plugins);
					});
				}else{
					grunt.log.writeln("\r"+plugin+" already installed");
					next_plugin(plugins);
				}
			});
		}
		normalize_vagrant_plugins(['vagrant-vbguest','vagrant-hosts','vagrant-hostsupdater']);
		
		
		
		var default_vagrant = {
			"ip": ip,
			"branch": "master",
			"owner": "washingtonstateuniversity",
			"box": "hansode/centos-6.5-x86_64",
			"box_url": false,
			"hostname": "general_server",
			"memory": "1024",
			"vram": "8",
			"cores": "1",
			"ioapic": "false",
			"acpi":"false",
			"largepages":"true",
			"hwvirtex":"true",
			"nestedpaging":"true",
			"verbose_output": "true",
			"gui":"false"
		};
		serverobj = grunt.file.readJSON('server_project.conf');
		var servers = serverobj.servers;
		//set up the vagrant object so that we can just define the server if we want to
		//the vagrant needs some defaults, and so it's vagrant default then remote then 
		//vagrant opptions
		for (var key in servers) {
			grunt.log.writeln("found server "+key);
			var server = servers[key];
			server.vagrant = extend(default_vagrant,server.remote,server.vagrant||{});
			grunt.log.writeln("extenting server "+key);
			servers[key]=server;
		}
		serverobj.servers = servers;


		var sourceFile = 'tasks/jigs/vagrant/Vagrantfile';
		var tmpFile = 'tasks/jigs/vagrant/Vagrantfile.tmp';
		var targetFile = 'Vagrantfile';
		var content = fs.readFileSync(sourceFile,'utf8');

		grunt.log.writeln("read file");
		grunt.log.writeln("renderString of file");
		var tmpl = new nunjucks.Template(content);
		grunt.log.writeln("compile");
		var res = tmpl.render(serverobj);
		grunt.log.writeln("renderd");
		fs.writeFile(targetFile, res, function(err){
			grunt.log.writeln("wrote to file");
		});

		var sourceDir = 'tasks/jigs/vagrant/includes';
		var targetDir = '.vagrant/includes';
		wrench.mkdirSyncRecursive(".vagrant/includes", 0777);
		wrench.copyDirSyncRecursive(sourceDir,targetDir,{
			forceDelete: true
		});
		//normalize_vagrant_env();
		
		//done();
		grunt.task.current.async();
	});
};