'use strict';
require('dotenv').config();

console.log(process.env);


module.exports = {
  // Core module
  AbstractClient: require('./core/abstract-client'),
  AbstractInventoryFactory: require('./core/abstract-inventory-factory'),
  Validator: './core/validator',

  // GitHub module
  GitHub: require('./github'),
  GitHubClient: require('./github/client'),
  GitHubInventoryFactory: require('./github/inventory-factory'),

}
