'use strict';


const _MEASUREMENT_TYPE_METHOD_ENUM = [
  'cost',
  'systems',
  'projects',
  'modules',
  'linesOfCode',
  'other'
];

const _RELEASE_STATUS_ENUM = [
  'Ideation',
  'Development',
  'Alpha',
  'Beta',
  'Release Candidate',
  'Production',
  'Archival'
];


class Validator {

  checkEnum (validList, value) {
    if (validList.indexOf(value) === -1) {
      throw new Error(`Expected '${value}' to be one of ` +
          JSON.stringify(validList));
    }

    return true;
  }

  checkIsArray (obj, name) {
    if (!Array.isArray(obj[name])) {
      throw new Error(`Expect '${name}' to be an array but it was not`);
    }

    return true;
  }

  /**
   * Checks typeof obj[name] === type returns true if true, throws exception
   * otherwise.
   *
   * @param obj {Object}
   *     The object on which to check the type of the named property
   * @param name {String} Optional.
   *     The name of the property to check If not provided, check the obj itself.
   * @param type {String}
   *     The expected type for the property to be
   *
   * @return {True}
   *     If typeof obj[name] === type
   &
   * @throws {Error}
   *     If typeof obj[name] !== type
   */
  checkTypeOf (obj, name, type) {
    let objType;

    if (!name) {
      objType = typeof obj;
      name = 'object itself'; // TODO :: Handle better?
    } else {
      objType = typeof obj[name];
    }

    if (objType === type) {
      return true;
    } else {
      throw new Error(`Expected ${name} to be of type '${type}' ` +
        `but received '${objType}'`);
    }
  }

  validate (codeJson) {
    return (
      this.checkTypeOf(codeJson, null, 'object') &&
      this.checkTypeOf(codeJson, 'version', 'string') && // TODO :: Regex SEMVER

      this.checkTypeOf(codeJson, 'measurementType', 'object') &&
      this.validateMeasurementType(codeJson.measurementType) &&

      this.checkTypeOf(codeJson, 'agency', 'string') &&

      this.checkIsArray(codeJson, 'releases') &&
      this.validateReleases(codeJson.releases)
    );
  }

  validateContact (contact) {
    return (
      this.checkTypeOf(contact, 'email', 'string') &&
      // Optional, but if present, should validate
      (
        !contact.hasOwnProperty('URL') ||
        this.checkTypeOf(contact, 'URL', 'string')
      ) &&
      (
        !contact.hasOwnProperty('name') ||
        this.checkTypeOf(contact, 'name', 'string')
      ) &&
      (
        !contact.hasOwnProperty('phone') ||
        this.checkTypeOf(contact, 'phone', 'string')
      )
    );
  }

  validateMeasurementType (measurementType) {
    return (
      this.checkTypeOf(measurementType, 'method', 'string') &&
      this.checkEnum(_MEASUREMENT_TYPE_METHOD_ENUM, measurementType.method) &&
      (
        measurementType.method !== 'other' ||
        this.checkTypeOf(measurementType, 'ifOther', 'string')
      )
    );
  }

  validateRelease (release) {
    release = release || {};

    return (
      this.checkTypeOf(release, 'name', 'string') &&
      this.checkTypeOf(release, 'repositoryURL', 'string') &&
      this.checkTypeOf(release, 'description', 'string') &&

      this.checkTypeOf(release, 'permissions', 'object') &&
      this.validatePermissions(release.permissions) &&

      this.checkTypeOf(release, 'laborHours', 'number') &&
      this.checkIsArray(release, 'tags') &&

      this.checkTypeOf(release, 'contact', 'object') &&
      this.validateContact(release.contact)

      // Optional, but if present, should be correct
      (
        !release.hasOwnProperty('version') ||
        this.checkTypeOf(release, 'version', 'string')
      ) &&
      (
        !release.hasOwnProperty('organization') ||
        this.checkTypeOf(release, 'organization', 'string')
      ) &&
      (
        !release.hasOwnProperty('status') ||
        (
          this.checkTypeOf(release, 'status', 'string') &&
          this.checkEnum(_RELEASE_STATUS_ENUM, release.status)
        )
      ) &&
      (
        !release.hasOwnProperty('vcs') ||
        this.checkTypeOf(release, 'vcs', 'string')
      ) &&
      (
        !release.hasOwnProperty('homepageURL') ||
        this.checkTypeOf(release, 'homepageURL', 'string')
      ) &&
      (
        !release.hasOwnProperty('downloadURL') ||
        this.checkTypeOf(release, 'downloadURL', 'string')
      ) &&
      (
        !release.hasOwnProperty('disclaimerText') ||
        this.checkTypeOf(release, 'disclaimerText', 'string')
      ) &&
      (
        !release.hasOwnProperty('disclaimerURL') ||
        this.checkTypeOf(release, 'disclaimerURL', 'string')
      ) &&
      (
        !release.hasOwnProperty('languages') ||
        this.checkIsArray(release, 'languages')
      ) &&
      (
        !release.hasOwnProperty('partners') ||
        (
          this.checkIsArray(release, 'partners') &&
          release.partners.every((partner) => {
            return (
              this.checkTypeOf(partner, 'name', 'string') &&
              this.checkTypeOf(partner, 'email', 'string')
            );
          })
        )
      ) &&
      (
        !release.hasOwnProperty('relatedCode') ||
        (
          this.checkIsArray(release, 'relatedCode') &&
          release.relatedCode.every((relatedCode) => {
            return (
              this.checkTypeOf(relatedCode, 'name', 'string') &&
              this.checkTypeOf(relatedCode, 'URL', 'string') &&
              this.checkTypeOf(relatedCode, 'isGovernmentRepo', 'boolean')
            );
          })
        )
      ) &&
      (
        !release.hasOwnProperty('reusedCode') ||
        (
          this.checkIsArray(release, 'reusedCode') &&
          release.reusedCode.every((reusedCode) => {
            return (
              this.checkTypeOf(reusedCode, 'name', 'string') &&
              this.checkTypeOf(reusedCode, 'URL', 'string')
            );
          })
        )
      ) &&
      (
        !release.hasOwnProperty('date') ||
        (
          this.checkTypeOf(release, 'date', 'object') &&
          (
            !release.date.hasOwnProperty('created') ||
            this.checkTypeOf(release.date, 'created', 'string')
          ) &&
          (
            !release.date.hasOwnProperty('lastModified') ||
            this.checkTypeOf(release.date, 'lastModified', 'string')
          ) &&
          (
            !release.date.hasOwnProperty('metadataLastUpdated') ||
            this.checkTypeOf(release.date, 'metadataLastUpdated', 'string')
          )
        )
      )
    );
  }

  validateReleases (releases) {
    return releases.every((release) => {
      return this.validateRelease(release);
    });
  }

  validateLicense (license) {
    return this.checkTypeOf(license, null, 'object') &&
      this.checkTypeOf(license, 'URL', 'string') &&
      this.checkTypeOf(licence, 'name', 'string')
  }

  validateLicenses (licenses) {
    return licenses === null || (
      Array.isArray(licenses) &&
      licenses.every(license => this.validateLicense)
    );
  }
}


Validator.RELEASE_STATUS_ENUM = _RELEASE_STATUS_ENUM;
Validator.MEASUREMENT_TYPE_METHOD_ENUM = _MEASUREMENT_TYPE_METHOD_ENUM;


module.exports = Validator;
