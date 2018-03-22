'use strict';


module.exports = {
  // Core module
  AbstractClient: require('./core/abstract-client'),
  AbstractInventoryFactory: require('./core/abstract-inventory-factory'),
  Validator: './core/validator',

  // GitHub module
  GitHub: require('./github'),
  GitHubClient: require('./github/client'),
  GitHubInventoryFactory: require('./github/inventory-factory'),

  // GitLab module
  GitLab: require('./gitlab'),
  GitLabClient: require('./gitlab/client'),
  GitLabInventoryFactory: require('./gitlab/inventory-factory')
}
