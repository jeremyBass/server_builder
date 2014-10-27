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

		servers = grunt.file.readJSON('server_project.conf');
		
		var nunjucks = require('nunjucks');
		var fs = require('fs');
		var wrench = require('wrench'),
			util = require('util');

		var sourceDir = 'tasks/jigs/vagrant/includes';
		var targetDir = 'includes';
		wrench.copyDirSyncRecursive(sourceDir,targetDir);

		var sourceFile = 'tasks/jigs/vagrant/Vagrantfile';
		var tmpFile = 'tasks/jigs/vagrant/Vagrantfile.tmp';
		var targetFile = 'Vagrantfile';
		var content = fs.readFileSync(sourceFile,'utf8')

		grunt.log.writeln("read file");
		grunt.log.writeln("renderString of file");
		var tmpl = new nunjucks.Template(content);
		grunt.log.writeln("compile");
		var res = tmpl.render(servers);
		grunt.log.writeln("renderd");
		fs.writeFile(targetFile, res, function(err){
			grunt.log.writeln("wrote to file");
		});
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