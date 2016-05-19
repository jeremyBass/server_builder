/* 
 * Location: within the server itself
 * State: bare
*/
module.exports = function(grunt) {
	grunt.registerTask('build', 'normalize the build call, ie grunt build named_task', function( ) {
		var task = 'build_' +  process.argv[3].slice(1,process.argv[3].length);
		grunt.task.run(task);
		//done();
		//grunt.task.current.async();
	});
};