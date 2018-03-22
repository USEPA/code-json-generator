#!/usr/bin/env node

const commander = require('commander');
      inquirer = require('inquirer');
      fs = require('fs');

const pkgJson = require('../package.json');

const GitHubInventoryFactory = require('../lib/github/inventory-factory'),
      GitLabInventoryFactory = require('../lib/gitlab/inventory-factory');



const createFactory = (config, endpoint) => {
  if (endpoint.type === 'github') {
    return new GitHubInventoryFactory(config, endpoint);
  } else if (endpoint.type === 'gitlab') {
    return new GitLabInventoryFactory(config, endpoint);
  } else {
    throw new Error(`Unknown factory type '${endpoint.type}'\n`);
  }
}

const combineInventories = (inventories) => {
  return inventories.reduce((combined, current) => {
    combined.releases = combined.releases.concat(current.releases);
    return combined;
  });
};

const createInventory = (config) => {
  let factories = config.endpoints.map((endpoint) => {
    return createFactory(config, endpoint);
  });
  let promises = factories.map(factory => factory.inventory());

  return Promise.all(promises).then((inventories) => {
    return combineInventories(inventories);
  }).then((inventory) => {
    inventory.releases.sort(releaseComparator);
    return inventory;
  });
};

const releaseComparator = (a, b) => {
  if (a.permissions.usageType === 'openSource' &&
      b.permissions.usageType !== 'openSource') {
    return -1;
  } else if (b.permissions.usageType === 'openSource' &&
      a.permissions.usageType !== 'openSource') {
    return 1;
  }

  // Both open source or both not, sort by name
  if (a.name < b.name) {
    return -1;
  } else if (b.name < a.name) {
    return 1;
  }

  // Same project, try sorting by date
  try {
    const aStamp = new Date(a.date.created).getTime();
    const bStamp = new Date(b.date.created).getTime();

    return aStamp - bStamp;
  } catch (e) {
    // Date sorting failed, just equal
    return 0;
  }
};


if (require.main === module) {
  commander
    .version(pkgJson.version)
    .option('-c, --configFile <file>', 'Configuration file')
    .parse(process.argv);


  Promise.resolve(commander.configFile).then((configFile) => {
    if (!configFile) {
      throw new Error('Configuration file not provided.');
    }
    return configFile;
  }).catch((err) => {
    return inquirer.prompt([{
      type: 'input',
      name: 'configFile',
      message: 'Please specify a configuration file'
    }]).then(answers => answers.configFile);
  }).then((configFile) => {
    if (!fs.existsSync(configFile)) {
      process.stderr.write(`Configuration file '${configFile}' not found.\n`);
      process.exit(-1);
    }

    return createInventory(JSON.parse(fs.readFileSync(configFile, 'UTF-8')));
  }).then((inventory) => {
    process.stdout.write(JSON.stringify(inventory, null, 2) + '\n');
    process.exit(0);
  }).catch((err) => {
    process.stderr.write(err.stack + '\n');
    process.exit(-1);
  });
}


module.exports = createInventory;
