module.exports = function(grunt) {
	grunt.registerTask('build_server', 'Building the server', function() {
		grunt.log.writeln("Would start building the sever");
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
		var targetDir = '../srv/salt';
		wrench.copyDirSyncRecursive(sourceDir,targetDir,{
			forceDelete: true
		});
		grunt.log.writeln(sourceDir+" >> "+targetDir);
	});
};