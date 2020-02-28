#!/usr/bin/env node

//////
//
// This script generates a mapping of active and stale users from GitLab
// endpoints. It ignores github.com since emails there are unreliable. In
// addition, users are grouped by join date to expose adoption rates/trends.
// Results are printed to STDOUT in CSV format and may be redirected to
// a file for additional review/processing.
//
// This script should be run with a configuration file containing only the
// GitLab endpoints mentioned above. For example:
//
// node ./bin/active-users -c ./config/usgs-git-hosting-platform.json
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

    const now = new Date().getTime();
    const staleAge = 60 * 1000 * 86400;
    const usersByJoinDate = {};
    const activeUsers = [];
    const staleUsers = [];

    allUsers[0].forEach(user => {
      const joinDate = user.created_at.split('T')[0];
      const activeDate = Math.max(
        Date.parse(user.last_sign_in_at),
        Date.parse(user.last_activity_on)
      );

      if (Math.abs(now - activeDate) <= staleAge) {
        // Active user
        activeUsers.push(user);
      } else {
        staleUsers.push(user);
      }

      if (!usersByJoinDate.hasOwnProperty(joinDate)) {
        usersByJoinDate[joinDate] = [];
      }

      usersByJoinDate[joinDate].push(user);
    });

    return {
      usersByJoinDate,
      activeUsers,
      staleUsers
    };
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
      process.stdout.write(`Active Users: ${users.activeUsers.length}\n`);
      process.stdout.write(`Stale Users: ${users.staleUsers.length}\n`);
      process.stdout.write(`Users by join date...\n`);
      joinDates = Object.keys(users.usersByJoinDate);
      joinDates.sort();
      joinDates.forEach(joinDate => {
        process.stdout.write(
          `${joinDate}, ${users.usersByJoinDate[joinDate].length}\n`
        );
      });
      process.exit(0);
    })
    .catch(err => {
      process.stderr.write(err.stack + '\n');
      process.exit(-1);
    });
}

module.exports = getUsers;
