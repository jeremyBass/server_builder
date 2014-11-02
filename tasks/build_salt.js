module.exports = function(grunt) {
	grunt.registerTask('build_vagrant', 'Setting up Vagrant and then building the server', function() {
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
		var ip,_ip="10.255.255.2";
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
		
		
		var default_vagrant = {
			"ip": ip,
			"branch": "master",
			"owner": "washingtonstateuniversity",
			"box": "centos-64-x64-puppetlabs",
			"box_url": "http://puppet-vagrant-boxes.puppetlabs.com/centos-65-x64-virtualbox-nocm.box",
			"hostname": "general_server",
			"memory": "1024",
			"vram": "8",
			"cores": "1",
			"host_64bit": "false",
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
		var content = fs.readFileSync(sourceFile,'utf8')

		grunt.log.writeln("read file");
		grunt.log.writeln("renderString of file");
		var tmpl = new nunjucks.Template(content);
		grunt.log.writeln("compile");
		var res = tmpl.render(serverobj);
		grunt.log.writeln("renderd");
		fs.writeFile(targetFile, res, function(err){
			grunt.log.writeln("wrote to file");
		});
		if (!fs.existsSync(".vagrant")) {
			fs.mkdir(".vagrant", 0777, true, function (err) {
				if (err) {
					grunt.log.writeln("failed to make folder .vagrant");
				} else {
					grunt.log.writeln("made folder .vagrant");
				}
			});
		}

		var sourceDir = 'tasks/jigs/vagrant/includes';
		var targetDir = '.vagrant/includes';
		wrench.copyDirSyncRecursive(sourceDir,targetDir);
		if (!fs.existsSync("server")) {
			fs.mkdir("server", 0777, true, function (err) {
				if (err) {
					grunt.log.writeln("failed to make folder .vagrant");
				} else {
					grunt.log.writeln("made folder .vagrant");
				}
			});
		}
		var sourceDir = 'tasks/jigs/salt';
		var targetDir = 'server/salt';
		wrench.copyDirSyncRecursive(sourceDir,targetDir);
		
		
		//fs.createReadStream(sourceFile).pipe(fs.createWriteStream(targetFile));
		/*
		var t;
		var foo = new cmd_exec('vagrant', ['up'], 
			function (me, data) {me.stdout = data.toString();},
			function (me) {me.exit = 1;t=null;}
		);
		var lastout;
		function stdoutStream(){
			var out = foo.stdout;
			if(lastout!=out){
				lastout=out;
				grunt.log.writeln(out);
			}
			t=setTimeout(stdoutStream,250);
		}
		stdoutStream();*/
		
		grunt.task.current.async();
	});
};