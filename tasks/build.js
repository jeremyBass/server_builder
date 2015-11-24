/* 
 * Location: within the server itself
 * State: bare
*/
module.exports = function(grunt) {
	grunt.registerTask('build', 'normalize the build call, ie grunt build named_task', function( name ) {
		grunt.task.run( 'build_' +name );
		//done();
		grunt.task.current.async();
	});
};