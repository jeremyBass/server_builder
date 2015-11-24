module.exports = function(grunt) {
	grunt.registerTask('build_tester', 'Setting up Vagrant and then building the server', function() {
		/*function cmd_exec(cmd, args, cb_stdout, cb_end) {
			var spawn = require('child_process').spawn,
				child = spawn(cmd, args),
				me = this;
			me.exit = 0;  // Send a cb to set 1 when cmd exits
			child.stdout.on('data', function (data) { cb_stdout(me, data) });
			child.stdout.on('end', function () { cb_end(me) });
		}
		
		var t;
		var foo = new cmd_exec('DIR *.*', [''], 
			function (me, data) {me.stdout = data.toString();},
			function (me) {me.exit = 1;t=null;}
		);
		var lastout;
		function stdoutStream(){
			var out = foo.stdout;
			if(lastout!=out){
				lastout=out;
				grunt.stdoutlog(out,true);
			}
			t=setTimeout(stdoutStream,250);
		}
		stdoutStream();*/
		
		/*
		require('shelljs/global');
		grunt.stdoutlog("test 1",true);
		var child = exec('DIR *.*', {async:true});
		child.stdout.on('data', function(data) {
			grunt.stdoutlog("test 1.2",true);
			exec('DIR *.*', function(code, output) {
			  console.log('Exit code:', code);
			  console.log('Program output:', output);
			});
		});

		grunt.stdoutlog("test 2",true);
		exec('DIR *.*', function(code, output) {
		  console.log('Exit code:', code);
		  console.log('Program output:', output);
		});*/
		
		
var util  = require('util'),
    spawn = require('child_process').spawn,
    ls    = spawn('vagrant', ['up']);

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
		
		
		
		grunt.task.current.async();
	});
};