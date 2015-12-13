{#
{
	"name":"index",
	"nav_link":"",
	"root":"./",
	"folder_root":"../",
	"title":"Main default",
	"vars":{
		"showstuff":true
	}
}
#}

<h1>server_builder</h1>
<h2 id="repo_github_header">Repo : <a href="https://github.com/{{ globals.repo.owner }}/{{ globals.repo.name }}">View On GitHub</a></h2>

{% markdown %}
This package will set up a server based on a configuration file.  The server provisioning will handle the server configuration as well as install apps that are configured to use this system.  The structure of the app is basic as well as templatable.

{% endmarkdown %}
