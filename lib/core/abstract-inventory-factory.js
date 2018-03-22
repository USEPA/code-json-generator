'use strict';

const Validator = require('./validator');


const MEASUREMENT_TYPE = 'projects';
const SCHEMA_VERSION = '2.0.0';

const ABSTRACT_WARNING = 'Abstract method "{{NAME}}" should not be called.';
const POLICY_START_DATE = new Date('2016-08-08T00:00:00.000Z');

class AbstractInventoryFactory {

  constructor (config, endpoint) {
    config = config || {};
    endpoint = endpoint || {};
    this.agency = config.agency || '';
    this.endpoint = JSON.parse(JSON.stringify(endpoint)); // Deep clone

    this.excludes = this.endpoint.excludes || [];
    this.isPrivate = this.endpoint.isPrivate;

    this.setClient(this.endpoint);
  }


  // --------------------------------------------------
  // API Methods
  // --------------------------------------------------

  /**
   * @APIMethod
   *
   * Generates the inventory JSON structure.
   *
   * @return {Promise<Object>}
   *     A promise resolving with the inventory JSON, or rejecting with
   *     an error if one should occur.
   */
  inventory () {
    return this.releases().then((releases) => {
      return this.wrap(releases);
    });
  }

  /**
   * @APIMethod
   *
   * Generates an array of releases for the current api endpoint.
   *
   *
   * @return {Promise<Array<Object>>}
   *     A promise resolving with an array of release objects compliant with
   *     the code.gov 2.0.0 metadata specification.
   */
  releases () {
    return this.client.getProjects().then((projects) => {
      projects = projects.filter((project) => {
        return this.projectFilter(project);
      });

      return Promise.all(projects.map((project) => {
        return this.projectToReleases(project);
      }));
    }).then((projectReleases) => {
      // projectReleases is an array of arrays. Each inner array is an array
      // of releases for a single project. Flatten this down to a single
      // array of releases for all projects.
      return projectReleases.reduce((combined, release) => {
        return combined.concat(release);
      });
    });
  }


  // --------------------------------------------------
  // Abstract Methods
  // --------------------------------------------------

  augmentRelease (release, project) {
    throw new Error(ABSTRACT_WARNING.replace('{{NAME}}', 'augmentRelease'));
  }

  createCodeJsonSnippet (project) {
    return Promise.reject(
      new Error(ABSTRACT_WARNING.replace('{{NAME}}', 'createCodeJsonSnippet'))
    );
  }

  fetchCodeJsonReleases (project) {
    return Promise.reject(
      new Error(ABSTRACT_WARNING.replace('{{NAME}}', 'fetchCodeJsonReleases'))
    );
  }

  projectFilter (project) {
    throw new Error(ABSTRACT_WARNING.replace('{{NAME}}', 'projectFilter'));
  }

  setClient (endpoint) {
    throw new Error(ABSTRACT_WARNING.replace('{{NAME}}', 'setClient'))
  }


  // --------------------------------------------------
  // Helper Methods
  // --------------------------------------------------

  correctCodeJsonErrors (release, project) {
    const corrected = JSON.parse(JSON.stringify(release));

    if (corrected.hasOwnProperty('repositoryUrl')) {
      // Typo in template provided to many users, up-convert for them
      process.stderr.write(`correcting repositoryUrl for ${corrected.name}\n`);
      corrected.repositoryURL = corrected.repositoryUrl;
      delete corrected.repositoryUrl;
    }

    if (!corrected.hasOwnProperty('laborHours') ||
        typeof corrected.laborHours !== 'number' ||
        corrected.laborHours === -1) {
      process.stderr.write(`correcting laborHours for ${corrected.name}\n`);
      corrected.laborHours = 0;
    }

    if (Validator.RELEASE_STATUS_ENUM.indexOf(corrected.status) === -1) {
      process.stderr.write(`correcting status for ${corrected.name}\n`);
      corrected.status = Validator.RELEASE_STATUS_ENUM[0];
    }

    return corrected;
  }

  determineExemption (projectStartDate) {
    if (projectStartDate.getTime() < POLICY_START_DATE.getTime()) {
      return 'exemptByPolicyDate';
    }

    return 'exemptByAgencyMission';
  }

  /**
   * Makes a best-effort at filling in the release object with any
   * missing data that is easily discernable by examining the project or
   * simply using defaults.
   *
   * @param release {Object}
   *     An object compliant with the code.gov release object in the
   *     metadata 2.0.0 specification.
   * @param project {Object}
   *     An object containing API response with information about the
   *     software project.
   *
   * @return {Promise<Object>}
   *     A (potentially) more complete object compliant with the code.gov
   *     release object in the metadata 2.0.0 specification.
   */
  enhanceRelease (release, project) {
    return Promise.resolve().then(() => {
      return this.correctCodeJsonErrors(release, project);
    }).then((upgraded) => {
      return this.augmentRelease(upgraded, project);
    }).then((augmented) => {
      return this.redactRelease(augmented);
    });
  }

  /**
   * Converts a project object as returned by the API into an array of
   * release objects as specified by the code.gov 2.0.0 Metadata Schema.
   *
   * @param project {Object}
   *
   * @return {Object}
   */
  projectToReleases (project) {
    return this.fetchCodeJsonReleases(project).then((codeJsonSnippet) => {
      return this.upgradeCodeJsonSnippet(codeJsonSnippet);
    }).catch((err) => {
      process.stderr.write(`Missing or invalid code.json for ${project.name}\n`);
      return this.createCodeJsonSnippet(project);
    }).then((releases) => {
      return Promise.all(releases.map((release) => {
        return this.enhanceRelease(release, project)
      }));
    });
  }

  redactRelease (release) {
    try {
      if (!this.isPrivate && release && release.permissions &&
          release.permissions.usageType === 'openSource') {
        return release;
      }

      const redacted = JSON.parse(JSON.stringify(release));

      // Change usageType and licenses
      redacted.permissions.usageType = this.determineExemption(
          new Date(release.date.created));
      redacted.permissions.licenses = [];

      // Suppress all URLs
      for (let key in redacted) {
        if (key && key.indexOf('URL') !== -1) {
          redacted[key] = '';
        }
      }

      // TODO :: More redactions
      return redacted;
    } catch (e) {
      console.log('redaction failed', release, e);
      throw e;
    }
  }

  upgradeCodeJsonSnippet (codeJsonSnippet) {
    const converted = JSON.parse(JSON.stringify(codeJsonSnippet));

    if (!Array.isArray(converted)) {
      converted = [converted];
    }

    return converted.map((item) => {
      if (item.hasOwnProperty('homepage')) {
        process.stderr.write(`converting homepage for ${item.name}\n`);
        item.homepageURL = item.homepage;

        delete item.homepage;
      }

      if (item.hasOwnProperty('openSourceProject') &&
          item.openSourceProject === 1) {
        process.stderr.write(`converting permissions for ${item.name}\n`);
        item.permissions = item.permissions || {};
        item.permissions.usageType =
            item.permissions.usageType || 'openSource';

        delete item.openSourceProject;
      }

      if (item.license) {
        process.stderr.write(`converting license for ${item.name}\n`);
        item.permissions = item.permissions || {};
        item.permissions.licenses = item.permissions.license || [];
        item.permissions.licenses.push({'URL': item.license});

        delete item.license;
      }

      if (item.hasOwnProperty('repository')) {
        process.stderr.write(`converting repository for ${item.name}\n`);
        item.repositoryURL = item.repository;

        delete item.repository;
      }

      if (item.hasOwnProperty('updated')) {
        process.stderr.write(`converting updated for ${item.name}\n`);
        item.date = item.updated;

        delete item.updated;
      }

      return item;
    });
  }

  wrap (releases) {
    return {
      'version': SCHEMA_VERSION,
      'agency': this.agency,
      'measurementType': {
        'method': MEASUREMENT_TYPE
      },
      'releases': releases || []
    }
  }
}


module.exports = AbstractInventoryFactory;
