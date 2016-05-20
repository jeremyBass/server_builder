/*jslint node: true*/

module.exports = function(grunt) {
    //lets look for configs
    function loadConfig(path) {
      var glob = require("glob");

      var object = {};
      var key;

      glob.sync("*", {cwd: path}).forEach(function(option) {
        key = option.replace(/\.js$/,"");
        object[key] = require(path + option);
      });

      return object;
    }

    var pkg,setbase,config,
        corePath = require("path"),
        fs = require("fs");
    var wrench = require("wrench");
    var util = require("util");
    var extend = require("extend");

    var merge = require("deepmerge");
    grunt.default_salt = {};
    var ip,_ip="10.255.255.2";
    grunt.default_vagrant = {
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



    pkg = grunt.file.readJSON("package.json");

    setbase = grunt.option("setbase") || pkg.build_location+"/"+pkg.build_version+"/";

    config = {
        pkg: pkg,
        setbase:setbase,
        config: {
            build: "build"
        }
    };

    grunt.util._.extend(config, loadConfig("./tasks/options/"));
    grunt.initConfig(config);

    grunt.getDateTime = function() {
        var date = new Date();

        var hour = date.getHours();
        hour = (hour < 10 ? "0" : "") + hour;

        var min  = date.getMinutes();
        min = (min < 10 ? "0" : "") + min;


        var year = date.getFullYear();

        var month = date.getMonth() + 1;
        month = (month < 10 ? "0" : "") + month;

        var day  = date.getDate();
        day = (day < 10 ? "0" : "") + day;

        return hour + "_" + min +"--" + day + "-" + month + "-"+year;
    };

    grunt.time = "";
    grunt.setFileTime = function (){
        grunt.time = grunt.getDateTime();
    };
    grunt.setFileTime();

    /*
     * Make sure that we have a place for the log file and that
     * it's been set for the task set running
     */
    grunt.ensure_logfile = function(){
        var logpath = grunt.setLogbase;
        grunt.logFile =  grunt.createFileName(logpath,grunt.time+"--node-serverbuilder-log.txt");
    };

    grunt.setLogbase = function(){
        var _base_path = "";
        var file = corePath.resolve( "/vagrant/" );
        try {
            _base_path = fs.statSync( file ).isDirectory() ? "/vagrant" : "";
        }
        catch (err) {}

        var logpath = _base_path + "/grunts";

        file = corePath.resolve( logpath );
        try {
            fs.statSync( logpath ).isDirectory();
        }
        catch (err) {
            wrench.mkdirSyncRecursive(logpath, 0777);
        }
        return logpath;
    }

    grunt.createFileName = function(name,base_path){
        name = name || grunt.time+"--node-serverbuilder-log.txt";
        base_path = base_path || grunt.setLogbase;
        return base_path+"/"+name;
    };

    /*
     * Writes to a log file and to the console as needed.
     * @ content [mixed] (string,object,boolean)
     * @ log_to_file [boolean] append to log file
     * @ file_only [boolean] don't send to stdout/stderr
     */
    grunt.stdoutlog = function( content, log_to_file, file_only, file_name ){
        log_to_file = log_to_file || false;
        file_only = file_only || false;
        file_name = file_name || grunt.logFile;

        var stdout = function( content ){
            if ( "string" === typeof content ) {
                grunt.log.writeln( content );
            } else {
                console.log( content );
            }
        };
        var bakeIt = function( content, callback ){
            var fs = require( "fs" );
            var util = require( "util" );
            var _content = content;
            if ( "string" !== typeof _content ) {
                _content = util.inspect( _content, false, null );
            } else {
                _content = content.split( "\n\n" ).join( "\n" );
            }

            fs.appendFile( file_name, _content + "\n", "utf8", function ( err ) {
                if( err ){
                    stdout( err );
                    throw err;
                }
                if( "function" === typeof callback ){
                    callback( content );
                }
            });
        };
        if( true === log_to_file || true === file_only ){
            bakeIt( content, true !== file_only ? stdout : null );
        }
        if( true !== file_only ){
            stdout( content );
        }
    };

    /*
     * Check if file exists
     */
    grunt.fileExist = function( filepath , log ){
        var file = corePath.resolve( filepath );
        log = log || true;
        try {
            if(log){
                grunt.stdoutlog("checking for :: "+file,true);
            }
            return fs.statSync( file ).isDirectory() || fs.statSync( file ).isFile();
        }
        catch (err) {
            if(log){
                grunt.stdoutlog(err,true);
                grunt.stdoutlog("failed check for :: "+file,true);
            }
            return false;
        }
    };

    grunt.resolve_server_obj = function( server, type ){
        var _pillars = {};
        var _type = server[type];
        if( "undefined" !== typeof _type.salt && "undefined" !== typeof _type.salt.pillars ){
            _pillars = _type.salt.pillars;
        }
        return _pillars;
    };


    /*
     * Make sure that we have a place for the log file and that
     * it's been set for the task set running
     */
    grunt.createEnvTmp = function( ){

        var serverobj = grunt.load_server_config();
        var servers = serverobj.servers;
        //set up the vagrant object so that we can just define the server if we want to
        //the vagrant needs some defaults, and so it's vagrant default then remote then
        //vagrant opptions
        for (var key in servers) {
            grunt.log.writeln("found server "+key);
            var server = servers[key];
            server.env = {
                salt: extend( true, grunt.default_salt, server.remote.salt, server.vagrant.salt||{} )
            };

            server.env.salt.states = grunt.create_env(server);
            server.vagrant = extend( true, grunt.default_vagrant, server.remote, server.vagrant||{} );
            grunt.log.writeln("extenting server "+key);

            var remote_pillars  = extend( true, grunt.resolve_server_obj(server,"remote") , {} );
            var vagrant_pillars = extend( true, grunt.resolve_server_obj(server,"vagrant") , {} );
            var app_pillars     = [];
            for ( var app_key in server.apps ) {
                var _app = server.apps[app_key];
                if( "undefined" !== typeof _app.remote.salt ){
                    if( "undefined" !== typeof _app.remote.salt.pillars ){
                        app_pillars = extend( true, app_pillars, _app.remote.salt.pillars );
                    }
                }
                if( "undefined" !== typeof _app.vagrant.salt ){
                    if( "undefined" !== typeof _app.vagrant.salt.pillars ){
                        app_pillars = extend( true, app_pillars, _app.vagrant.salt.pillars );
                    }
                }
            }

            var pillars = extend( true, extend( true,  remote_pillars, vagrant_pillars ), app_pillars );
            server.env.salt.pillars = pillars;

            servers[key] = server;
        }
        serverobj.servers = servers;
        grunt.stdoutlog(serverobj,true);
        return serverobj;
    };

    grunt.create_env = function( _current_server ){
        var remote_env  = "undefined" !== typeof _current_server.remote.salt ? _current_server.remote.salt.env : [ ];
        var vagrant_env = "undefined" !== typeof _current_server.vagrant.salt ? _current_server.vagrant.salt.env : [ ];
        var app_env = [];
        for (var app_key in _current_server.apps) {
            var app = _current_server.apps[app_key];
            if( "undefined" !== typeof app.salt ){
                if( "undefined" !== typeof app.salt.env ){
                    app_env = merge(app_env,app.salt.env);
                }
            }
        }

        //_current_server.salt = extend( grunt.default_salt, _current_server.remote.salt, _current_server.vagrant.salt||{} );

        var env = merge(merge(remote_env, vagrant_env),app_env);
        var _env = [];
        env.forEach(function(entry) {
            //grunt.stdoutlog("looking at env "+entry,true);
            if( 0 === entry.indexOf("-") ){
                var _entry = entry.substring(1);
                //grunt.stdoutlog("checking for "+_entry,true);
                var exc = _env.indexOf(_entry);
                //grunt.stdoutlog(_entry+" has index at "+exc,true);
                if( exc > -1){
                    _env.splice(exc, 1);
                }
            }else{
                if( -1 === _env.indexOf(entry) ){
                    _env.push(entry);
                }
            }
        });
        return _env;
    };

    grunt.load_server_config = function( config_path ){
        var config_file = config_path||"server_project.conf";
        if( fs.existsSync("/server_project.conf") ){
            config_file = "/server_project.conf";
            grunt.stdoutlog("using from root :: "+config_file,true);
        }
        var serverobj = grunt.file.readJSON(config_file);
        return serverobj;
    };

    grunt.lastout="";
    grunt.output_stream = function(sdt_stream,prefix,sufix){
        prefix = prefix || "";
        sufix = sufix || "";
        var out = sdt_stream.toString().trim();
        if( "\n" !== out && null !== out && "" !== out  && grunt.lastout !== out){
            grunt.lastout = out;
            out = out.split("\n\n").join("\n");
            util.print( prefix+out + sufix );
        }
    };

    grunt.ensure_logfile();

    require("load-grunt-tasks")(grunt);
    grunt.loadTasks("tasks");

    // Default task(s).
    grunt.registerTask("default", ["jshint"]);

    grunt.registerTask("prod", [
        "env:prod",
        "build"
    ]);

    grunt.registerTask("dev", [
        "jshint",
        "env:dev",
        "build"
    ]);

};
