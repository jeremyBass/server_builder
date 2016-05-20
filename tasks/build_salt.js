/*jshint node: true*/
/*
* Location: within the server itself
* State: bare
*/
module.exports = function( grunt ) {
    grunt.registerTask( "build_salt", "Setting up the salt provisioner", function( ) {

        var nunjucks = require( "nunjucks" );
        var path = require( "path" );
        var fs = require( "fs" ),
            fsx = require( "fs-extra" );
        var wrench = require( "wrench" );


        var nenv = new nunjucks.Environment( );
        grunt.logFile =  grunt.createLogFileName(grunt.time+"_build_salt.txt");

        nenv.addFilter( "leadingzero", function( int, zerocount ) {
            var base = "";
            var count = zerocount || ( int + "" ).length;
            for ( var i = 0; i < count; i++ ) {
                base += "0";
            }
            var charLength = ( base.length - ( int + "" ).length );

            return ( base.substring( 0, charLength ) ) + int + "";
        });


        wrench.mkdirSyncRecursive( "server/salt", 0777 );
        var sourceDir = path.resolve( "tasks/jigs/salt" );
        var targetDir = path.resolve( "server/salt" );

        grunt.stdoutlog( "copy " + sourceDir, true );
        grunt.stdoutlog( "to " + targetDir, true );

        fsx.copy( sourceDir, targetDir, { "clobber": true }, function ( err ) {
            if ( err ){
                return grunt.stdoutlog( err, true );
            }
        });

        grunt.stdoutlog( "building the salt minions", true) ;

        wrench.mkdirSyncRecursive( "server/salt/deploy_minions", 0777 );

        var serverobj = grunt.createEnvTmp( );
        var servers = serverobj.servers;

        function load_apps( app_obj, callback ){
            grunt.stdoutlog( "start load_apps()", true );
            if( app_obj === false ){
                app_obj=[];
                grunt.stdoutlog( "needed app_obj ", true );
                for ( var key in servers ) {
                    grunt.stdoutlog( "adding " + key + " to app_obj", true );
                    var server = servers[ key ];
                    for ( var app_key in server.apps ) {
                        var app = server.apps[ app_key ];
                        var app_op= {};
                        if( app.repo ){
                            app_op.repo = app.repo;
                        }
                        if( app.branch ){
                            app_op.branch = app.branch;
                        }
                        if( app.tag ){
                            app_op.tag = app.tag;
                        }
                        if( app.install_dir ){
                            app_op.install_dir = app.install_dir;
                        }
                        app_obj.push(app_op);
                    }
                }
            }
            if( app_obj.length>0 ){
                var _app_op = app_obj[0];
                app_obj.shift( );

                var gitArg = [];
                if( grunt.fileExist( "/var/app/" + _app_op.install_dir + "/.git/config" ) ){
                    grunt.stdoutlog( "/var/app/" + _app_op.install_dir + "/.git/config !! existed !!", true );
                    gitArg.push(" up ");
                }else{
                    grunt.stdoutlog( "/var/app/" + _app_op.install_dir + "/.git/config !! DID NOT exist :/ ", true );
                }
                if(_app_op.install_dir){
                    gitArg.push( " -p /var/app/" + _app_op.install_dir + "/ " );
                }
                if(_app_op.branch){
                    gitArg.push( " -b " + _app_op.branch + " " );
                }
                if(_app_op.tag){
                    gitArg.push( " -t " + _app_op.tag + " " );
                }
                if(_app_op.install_dir){
                    gitArg.push( " " + _app_op.install_dir + " " );
                }
                if(_app_op.repo){
                    gitArg.push( " " + _app_op.repo );
                }
                grunt.stdoutlog( "gitploy " + _app_op.install_dir );
                grunt.stdoutlog( "gitArg: " + gitArg + " \n" );
                grunt.stdoutlog( "cwd: gitploy" + gitArg.join(" ") + " \n" );

                var spawnCommand = require( "spawn-command" ),
                    ls = spawnCommand("cd / && gitploy "+gitArg.join(" "));

                grunt.lastout="";
                ls.stdout.on( "data", function ( data ) {
                    grunt.output_stream(data,"\n");
                });
                ls.stderr.on( "data", function ( data ) {
                    grunt.output_stream( data,"\n" );
                });
                ls.on("exit", function ( code ) {
                    grunt.output_stream( code,"\n","<<<<<<<< finished sever "+_app_op.install_dir+"\n" );
                    if( app_obj.length>0 ){
                        load_apps( app_obj, callback );
                    }else{
                        grunt.stdoutlog("Finished app downloads",true);
                        if( "function" === typeof callback ){
                            callback();
                        }
                    }
                });
            }else{
                grunt.stdoutlog("failed to load app_obj and started exit -- no apps loaded",true);
                if( "function" === typeof callback ){
                    callback();
                }
            }
        }

        var pillars = [];
        var _used_app;
        function build_pillars(_item) {
            var item = _item.path.split("/").pop();
            pillars.push(_item.path);
            if( -1 !== item.indexOf(".sls") ){

                grunt.stdoutlog( item + " -item for\r", true, true );
                grunt.stdoutlog( _used_app.install_dir + " -item for\r",true, true );

                var sourceFile = "/var/app/" + _used_app.install_dir + "/provision/salt/pillar/_pillar-jigs/" + item;
                var targetFile = "/var/app/" + _used_app.install_dir + "/provision/salt/pillar/" + item;
                grunt.stdoutlog( "trying to get ---" + item + "--- for " + sourceFile, true, true );
                grunt.stdoutlog( "to  " + targetFile, true, true );

                var content = fs.readFileSync(sourceFile,"utf8");
                try{
                    grunt.stdoutlog( "renderString of file", true, true );
                    var tmpl = new nunjucks.Template( content, nenv );
                    grunt.stdoutlog( "compile", true );
                    var res = tmpl.render( _current_server.env.salt );
                    grunt.stdoutlog( "renderd pillar ---" + item + "--- for " + _used_app.install_dir, true, true );
                    fs.writeFile( targetFile, res, function(err){
                        grunt.stdoutlog( err ? err : "wrote pillar :: "+targetFile, true );
                    });
                }catch (err) {
                    grunt.stdoutlog( "failed on " + item + "--- for " + _used_app.install_dir, true );
                    grunt.stdoutlog( err, true );
                }
            }
        }

        var _current_server;
        function logPillarCreation( pillars ){
            grunt.stdoutlog( pillars, true, true );
        }
        function logErrorPillarCreation(err){
            grunt.stdoutlog( err ? err : "wrote to file", true, true);
        }
        function start_salt_production(){
            //set up the vagrant object so that we can just define the server if we want to
            //the vagrant needs some defaults, and so it's vagrant default then remote then
            //vagrant opptions
            grunt.stdoutlog( "start start_salt_production()", true );

            for (var key in servers) {
                grunt.stdoutlog("found server salt "+key,true);
                _current_server = servers[key];
                _current_server.salt={};

                grunt.stdoutlog( _current_server.apps, true );
                for ( var app_key in _current_server.apps ) {
                    _used_app = _current_server.apps[ app_key ];
                    // options is optional
                    grunt.stdoutlog( _used_app, true, true );
                    pillars = [];
                    fsx.walk( "/var/app/" + _used_app.install_dir + "/provision/salt/pillar/_pillar-jigs/" )
                    .on( "data", build_pillars )
                    .on( "end", function(){grunt.stdoutlog( pillars, true, true );} );
                }
                grunt.stdoutlog( "extenting server salt for " + key, true );
                grunt.stdoutlog( "minion " + _current_server.env.salt.minion, true );
                grunt.stdoutlog( "env.states " + _current_server.env.salt.states, true, false, grunt.createLogFileName(grunt.time+"_State.txt") );

                var sourceFile = "tasks/jigs/salt/minions/_template.conf";
                var targetFile = "server/salt/deploy_minions/" + _current_server.env.salt.minion + ".conf";
                var content = fs.readFileSync( sourceFile, "utf8" );

                grunt.stdoutlog( "sourceFile :: " + sourceFile, true, true );
                grunt.stdoutlog( "targetFile :: " + targetFile, true, true );

                var tmpl = new nunjucks.Template( content );
                var res = tmpl.render( _current_server );
                grunt.stdoutlog( _current_server, true, true );
                grunt.stdoutlog( "renderd", true, true );
                fs.writeFile( targetFile, res, function(err){
                    grunt.stdoutlog( err ? err : "wrote to file", true, true);
                } );
            }
        }
        load_apps( false, start_salt_production );

        //done();
        grunt.task.current.async();
    });
};
