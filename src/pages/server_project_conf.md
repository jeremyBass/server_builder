{#
{
	"name":"server_project_conf",
	"root":"./site/",
	"folder_root":"../site/",
	"title":"Provisioning Configuration",
	"nav_title":"Provisioning Configuration",
	"vars":{
		"showstuff":true
	},
	"child_nav":{}
}
#}

{% markdown %}
server_builder config file
==============

The config file is meant to make it where you don't ever have to edit any off the server provisioning options directly.  It also is compiled in to ways to allow the user to design the remote server to as close as possible to the local server.  Ideally you only have to provide the remote settings and you'll still get a working local development server.  Also since it's not versioned you get to keep all your secure data with in and just pass it to any of the other `app` repos use.

### Example basic setup
The base provisioner it `salt` and we can pass in the envs used and pillar data. In the example below we are going to set up a basic server and call to have a user and set up the port as well as make sure the caching is off.

```json
{
	"servers":{
		"server2": {
			"remote": {
				"ip": "10.255.255.3",
				"salt":{
					"env": [
						"serverbase",
						"database",
						"security",
						"web",
						"webcaching"
					],
					"pillars":{
						"mysql":{
							"users":{
								"username":"foo",
								"passwd":"bar"
							},
							"port":"3360",
							"caching":"false"
						}
					}
				}
			}
		}
	}
}

```

### load order
The config data is complied before it's used.  When you set up your config you will have the expanded data object laid out in two basic sections, `remote` and `vagrant` and there is a secoundary section, `apps`, that has another `remote` and `vagrant`.  The remote data is always expanded by the vagrant data.  The base server setting are expanded by the app settings.  What this means is that you can define only the remote server data object and you have also defined the vagrant settings as well.  If you want to alter the vagrant setting to be slightly different then the remote you have the ablitly to do so.  This give you the power to be as close as possible to the remote server in your local dev server with out having to alter any of the provisioning.  An example of this is:

```json
{
	"servers":{
		"server2": {
			"remote": {
				"ip": "10.255.255.3",
				"salt":{
					"env": [
						"serverbase",
						"database",
						"security",
						"web",
						"webcaching"
					]
				}
			},
			"vagrant": {
				"salt":{
					"env": [
						"-webcaching"
					]
				}
			}
		}
	}
}

```

In this set up we are setting up the environment for the remote but we are removing a value.  For this example we are not wanting to have web caching turned on for the dev server while doing normal devlopment.

To be clear the the data is compiled in this manner.

***[ remote + vagrant ] + [ app/remote + app/vagrant ] = [ final data object ]***

This also allows us to let an app load a new environment to the server object with out any need to alter the provisioning.  An example of that will be below.


### Sample usage

```json

{
	"servers":{
		"server2": {
			"remote": {
				"ip": "10.255.255.3",
				"salt":{
					"env": [
						"serverbase",
						"database",
						"security",
						"web",
						"webcaching"
					],
					pillars:{
						mysql:{}
					}
				}
			},
			"vagrant": {
				"hostname": "web_app_block",
				"memory": "6144",
				"vram": "8",
				"cores": "2",
				"host_64bit": "false",
				"minion": "vagrant",
				"verbose_output": "true",
				"shared_folders": {
					"/var/app": {
						"dest": "/var/app",
						"from": "server/app",
						"user": "uid=510,gid=510",
						"dmode": "dmode=775",
						"fmode": "fmode=774"
					}
				},
				"salt":{
					"env": [
						"-webcaching"
					],
					pillars:{
						mysql:{}
					}
				}
			},
			"apps": {
				"store.wsu.edu": {
					"repo": "-b master https://github.com/washingtonstateuniversity/WSUMAGE-base.git",
					"repoid": "jeremyBass/WSUMAGE-base",
					"install_dir":"stores",
					"remote": {
						"database_host": "10.255.255.3",
						"sample_date": "false",
						"hosts": [
							"store.mage.dev"
						],
						"salt":{
							"env": [
								"serverbase",
								"database",
								"security",
								"web",
								"webcaching"
							],
							pillars:{
								mysql:{}
							}
						}
					},
					"vagrant": {
						"database_host": "2",
						"sample_data": "true",
						"hosts": [
							"store.mage.dev",
							"events.store.mage.dev",
							"student.store.mage.dev",
							"general.store.mage.dev",
							"store.admin.mage.dev",
							"tech.store.mage.dev"
						],
						"salt":{
							"env": [
								"magento"
								"-webcaching"
							],
							pillars:{
								mysql:{},
								magento:{}
							}
						}
					}
				}
			}
		}
	}
}

```

{% endmarkdown %}
