Inventory
=========

This application generates a machine-readable software inventory compliant
with [Code.gov Metadata Schema version 2.0.0][1]. To accomplish this goal,
the application connects to a series of Git hosting API "endpoints",
inspects the configured projects, and generates an inventory.

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

### Run the application

The application provides command-line usage syntax help via the `--help` switch.
```
$ create-inventory.js --help

  Usage: create-inventory [options]

  Options:

    -V, --version            output the version number
    -c, --configFile <file>  Configuration file
    -h, --help               output usage information
```

To generate an inventory, run the application and provide a configuration file
using the `--configFile <file>` switch. The generated inventory will, by
default, be printed to STDOUT. This output can be redirected to a file
for persistence.

```
$ create-inventory.js --configFile ./create-agency-inventory.config.json > code.json
```
> Note: This example assumes a file containing proper configuration is located
> in the current working directory and is called `create-agency-inventory.config.json`.
> Adjust this usage to suit actual work environment.


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
