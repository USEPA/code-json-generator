# Inventory

This project generates a machine-readable inventory of USGS software releases.

## Background
Federal policy requires we inventory our software. See [code.gov](https://code.gov/#/policy-guide/docs/compliance/inventory-code) for details. USGS releases are expected to be found on one of three git hosting solutions:
 * The [USGS GitHub](https://github.com/usgs)
 * The public-facing USGS git hosting solution [code.usgs.gov](https://code.usgs.gov)
 * The private-facing USGS git hosting solution

## Setup
 * Clone this repository
 * Navigate to the cloned directory
 * Install dependencies by running `npm install`
 * Copy `config-template.json` to `config.json`. Update the example values to real values.

## Usage

### Generating the Inventory
Run `nodejs index.js`.

