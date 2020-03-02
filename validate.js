'use strict';

const fs = require('fs');
const Validator = require('jsonschema').Validator;

function validate (inventoryFileName, schemaFileName) {
  const inventory = JSON.parse(fs.readFileSync(inventoryFileName, 'utf8'));
  const schema = JSON.parse(fs.readFileSync(schemaFileName, 'utf8'));
  const validator = new Validator();
  console.log(validator.validate(inventory, schema));
}

function main() {
  const inventoryFileName = process.argv[2] || 'code.json';
  const schemaFileName = process.argv[3] || 'schema.json';
  validate(inventoryFileName, schemaFileName);
}
main();
