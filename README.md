
Inventory
=========

![Daily code.json update](https://github.com/testorg-2020/code-json-generator/workflows/Daily%20code.json%20update/badge.svg)

This application generates a machine-readable software inventory compliant
with [Code.gov Metadata Schema version 2.0.0][1]. To accomplish this goal,
the application connects to a series of Git hosting API "endpoints",
inspects the configured projects, and generates an inventory. This application has been enhanced to automate the generation of the [Agency's code.json file](https://code-json-cg.app.cloud.gov/code.json) through GitHub Actions.

The application configuration supports internal/external hosting platforms
with or without authentication (for private repositories). It currently works
with GitHub and GitLab REST APIs but could easily be extended for other hosting
platform APIs as well.

For each project, the application will attempt to use a developer-provided
"code.json" snippet which is a JSON file containing the "releases" array
for the project as defined by the [Code.gov Metadata Schema version 2.0.0][1].

If a "code.json" snippet file is not provided by the project maintainer, the
application will attempt to infer sufficient/required properties from the
target project and generate the best possible metadata for inclusion in the
agency inventory.


Getting Started
---------------

This section describes the process to acquire and run the code-json-generator
application.

### Prerequisites

This application is a command line Node application. Node must be installed
on the system prior to running this application.

[https://nodejs.org/][2]

### Install the application

On the command line:
```
$ npm install -g code-json-generator
```

### Configure the application runtime

The application requires a configuration file to dictate which repositories
to include in the generated inventory. An [example configuration file][3]
is provided to help get started.

1. Update the configuration file with your Agency's respective endpoints.
2. Delete the existing create-agency-inventory-config.js file in the bin folder.
3. Move the new configuration file from the etc folder into the bin folder.
4. Rename the configuration file to create-agency-inventory-config.js.

### Run the application locally

Running the application locally will help identify the specific repositories with missing or invalid code.json files. After all repositories have a valid code.json file, running the application will generate the Agency code.json locally.

The application provides command-line usage syntax help via the `--help` switch.
```
$ create-inventory.js --help

  Usage: create-inventory [options]

  Options:

    -V, --version            output the version number
    -c, --configFile <file>  Configuration file
    -h, --help               output usage information
```
To run the application locally, you need to:

1. Change the working directory to the bin folder. 

2. To generate an inventory, run the application and provide a configuration file
using the `--configFile <file>` switch. The generated inventory will, by
default, be printed to STDOUT. This output can be redirected to a file
for persistence.

``` 
$ create-inventory.js --configFile ./create-agency-inventory.config.json > code.json
```
> Note: This example assumes a file containing proper configuration is located
> in the current working directory and is called `create-agency-inventory.config.json`.
> Adjust this usage to suit actual work environment.

Deployment to Cloud.gov with GitHub Actions
-------------------------------------------
You can deploy the app to Cloud.gov with (or without) GitHub Actions.

### Prerequisites
To do this you will need a Cloud.gov account and the [Cloud Foundry Command Line Tools](https://github.com/cloudfoundry/cli#installers-and-compressed-binaries) installed on your machine.  

1. Login to cloud.gov
2. Navigate to your organization's space which the app will be deployed to.
3. Create a service account (space deployer), build and deploy the app to Cloud.gov.
4. Create a service key.
5. Add the service key username as the CG_USERNAME secret in the GitHub Repository's Secrets.
6. 5. Add the service key username as the CG_USERNAME secret in the GitHub Repository's Secrets. 
  
- From `app` directory run:  
`npm run cloudgov`  
  
- Change directories to `app\dist\cloudgov` and run:  
`cf push test-power-profile`  
  
*Note: you will first need to log into Cloud.gov (see `cf login`)*  

Agecny code.json Daily update through GitHub Actions

GitHub Actions is being used to run a scheduled event to create the Agency's code.json file daily.

As mentioned earlier, if a "code.json" snippet file is not provided by the project maintainer, the
application will attempt to infer sufficient/required properties from the
target project and generate the best possible metadata for inclusion in the
agency inventory.

The example EPA Agency code.json for the github.com/USEPA organization can be [found here](https://code-json-cg.app.cloud.gov/code.json). 

test text, ignore.


Development
-----------

To develop and possibly contribute to this project please review the
[code of conduct][4] and [contributing guidelines][5].

### Obtain the source code

Potentially fork this repository and then clone the fork to obtain the source
code.

```
$ git clone <fork_urn>/code-json-generator.git
$ cd code-json-generator
```

### Develop in a feature branch

Updates should be developed in a feature branch on the local clone of a fork.
```
$ git checkout -b feature-X
```

### Submit pull requests for review and integration

Commit changes to feature branches and push feature branches to the forked
remote. Submit a pull request back to this upstream repository for review
and integration. If the pull request fixes an open issue on this repository,
include the text `fixes #N` (where `N` is the issue number fixed) in the
pull request title or description.
```
$ git commit -am 'Implemented feature'
$ git push origin feature-X
```


[1]: https://code.gov/#/policy-guide/docs/compliance/inventory-code
[2]: https://nodejs.org/
[3]: ./etc/config-example.json
[4]: ./CODE_OF_CONDUCT.md
[5]: ./CONTRIBUTING.md

### Credits

This repository reused material from the [USGS code-json-generator repository](https://github.com/usgs/code-json-generator/).

### Disclaimer

The United States Environmental Protection Agency (EPA) GitHub project code is provided on an "as is" basis and the user assumes responsibility for its use.  EPA has relinquished control of the information and no longer has responsibility to protect the integrity , confidentiality, or availability of the information.  Any reference to specific commercial products, processes, or services by service mark, trademark, manufacturer, or otherwise, does not constitute or imply their endorsement, recommendation or favoring by EPA.  The EPA seal and logo shall not be used in any manner to imply endorsement of any commercial product or activity by EPA or the United States Government.
