#!/usr/bin/env node

//////
//
// This script generates a unique list of users from GitLab endpoints. It
// ignores github.com since emails there are unreliable.
//
// This script should be run with a configuration file containing only the
// GitLab endpoints mentioned above. For example:
//
// node ./bin/get-users -c ./users-config.json
//
/////

const commander = require('commander'),
  inquirer = require('inquirer'),
  fs = require('fs');

const pkgJson = require('../package.json');

const GitLabClient = require('../lib/gitlab/client');

const createClient = function(endpoint) {
  if (endpoint.type === 'gitlab') {
    return new GitLabClient(endpoint);
  } else {
    process.stderr.write(
      `Unknown factory type '${endpoint.type}' (${endpoint.host}). Skipping.\n`
    );
    return null;
  }
};

const getUsers = function(config) {
  let clients = config.endpoints
    .map(endpoint => {
      return createClient(endpoint);
    })
    .filter(client => !!client);

  return Promise.all(
    clients.map(client => {
      return client.getUsers();
    })
  ).then(allUsers => {
    const uniqueUsers = {};

    // Merge all users into unique list
    allUsers.forEach(endpointUsers => {
      endpointUsers.forEach(user => {
        const key = user.username;
        const value = `'${user.name}' <${user.email}>`;

        if (key === 'root') {
          return;
        }

        uniqueUsers[key] = value;
      });
    });

    // Convert unique object into array and return
    return Object.keys(uniqueUsers).map(key => uniqueUsers[key]);
  });
};

if (require.main === module) {
  commander
    .version(pkgJson.version)
    .option('-c, --configFile <file>', 'Configuration file')
    .parse(process.argv);

  Promise.resolve(commander.configFile)
    .then(configFile => {
      if (!configFile) {
        throw new Error('Configuration file not provided');
      }
      return configFile;
    })
    .catch(err => {
      return inquirer
        .prompt([
          {
            type: 'input',
            name: 'configFile',
            message: 'Please specify a configuration file'
          }
        ])
        .then(answers => answers.configFile);
    })
    .then(configFile => {
      if (!fs.existsSync(configFile)) {
        process.stderr.write(`Configuration file '${configFile}' not found\n`);
        process.exit(-1);
      }

      return getUsers(JSON.parse(fs.readFileSync(configFile, 'UTF-8')));
    })
    .then(users => {
      process.stdout.write(JSON.stringify(users, null, 2) + '\n');
      process.exit(0);
    })
    .catch(err => {
      process.stderr.write(err.stack + '\n');
      process.exit(-1);
    });
}

module.exports = getUsers;
