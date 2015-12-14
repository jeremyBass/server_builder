{#
{
	"name":"under_the_hood",
	"root":"./site/",
	"folder_root":"../site/",
	"title":"Under The Hood",
	"nav_title":"Under The Hood",
	"vars":{
		"showstuff":true
	},
	"child_nav":{
		"#how-does-this-function":"Overview",
		"#when-local":"Local",
		"#when-non-local":"Non Local"
	}
}
#}

{% markdown %}
How does this function
==============
The server builder works by using a combination of deployment and task applications to create a LEMP stack with the application layer installed.  The goal is to allow for one configuration to define the whole stack.  The project is set up so that we work backwards from one file that describes everything about the server stack and projects loaded on the server stack.  In order to make this happen we start by parting out the whole process into two sections.

1. Set up the Server
1. Set up the Applications

This provides the line on where you create your application repository verse this repository.  The application repository would have many of the same parts as this server base, and extends the setup accordingly.  The `server_project.conf` file is a `JSON` object that describes a deployment for production, and variants for a local version of the production servers.  To create the local server, `Vagrant` is used with `VirturalBox`.  This needs to have a `Vagrant` file that describes the instance parameters and actions that will occur when it's brought up.  The server it's self is provisioned with `Salt` and versioned with `Gitploy` via `git`.  `Salt` uses `pillar` files to describe what will be done on the server.  This project takes 2 steps with `Salt` to first set up the server base that is meant to cover all the needs of most any application layer, and if needed, the collated needs from the application object defined in the `server_project.conf`  file versioned in.  This is the overview of what needs to happen.

## Process steps
#### When local
1. Use Grunt to prepare the repo folder and anything needed to get the `Vagrant` setup ready based on the `server_project.conf` file
1. As the box is brought up, the production steps are now run, with symlinks for the application folder on the box.  Otherwise just a `EVN` flag is set to denote the local server.  Everything else is run the same as the production process.

#### When non-local
1. a `bootstrap.sh` file is called, which provides an install of items needed on a server.
1. It then creates the server object and from that id's any apps that need to be versioned in.
1. Once that is done it calls for the salt pillar builder for both the server and apps loaded
1. After the building of all the pillars based on the `server_project.conf` file it will run the salt states

That is the broad stoke on all of the steps that happen in the build.  This basically simplifies the build by keeping one json config file that describes everything across all of the different technologies.  It uses `Grunt` on `node.js` to build all of the settings for both Vagrant and Salt producing the closest matching set of servers for a developer.



{% endmarkdown %}
