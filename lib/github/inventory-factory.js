'use strict';

const fetch = require('node-fetch');

const GitHubClient = require('./client'),
      AbstractInventoryFactory = require('../core/abstract-inventory-factory');


class GitHubInventoryFactory extends AbstractInventoryFactory {

  augmentRelease (release, project) {
    // TODO
    return release;
  }

  correctCodeJsonErrors (release, project) {
    const corrected = super.correctCodeJsonErrors(release, project);

    if (project.private) {
      release.permissions.usageType = this.determineExemption(
          new Date(project.created_at));
    }

    return corrected;
  }

  /**
   * Attempts to infer basic release properties from the given project.
   *
   * @return {Promise<Array<Object>}
   *     A promise resolving with an array of release objects conforming to the
   *     code.gov 2.0.0 metadata specification.
   */
  createCodeJsonSnippet (project) {
    const endpoint = this.endpoint;
    const isPublic = !(this.isPrivate || project.private);
    const url = project.html_url;

    const owner = project.owner || {};
    const organization = endpoint.organizationDisplay || endpoint.organization;

    const snippet = {
      'name': project.full_name,
      'organization': organization,
      'description': project.description || '',
      // TODO :: Check api for tags/releases?
      'version': '',
      'status': 'Development',

      'permissions': {
        'usageType': isPublic ? 'openSource' :
            this.determineExemption(new Date(project.created_at)),
        'licenses': !isPublic ? null : [
          // TODO :: Make sure this file exists ... (it should)
          {'URL': `${url}/blob/master/LICENSE.md`}
        ]
      },

      'homepageURL' : isPublic ? url : '',
      'downloadURL': isPublic ? `${url}/archive/master.zip` : '',
      'disclaimerURL': isPublic ? `${url}/blob/master/DISCLAIMER.md` : '',
      'repositoryURL': isPublic ? `${project.clone_url}/` : '',
      'vcs': 'git',

      'laborHours': 0,
      'tags': ['usgs'],
      'languages': [],

      'contact': {
        'name': owner.login
      },
      'date': {
        'created': project.created_at,
        'lastModified': project.pushed_at,
        'metadataLastUpdated': (new Date()).toISOString()
      }
    };

    return Promise.resolve().then(() => {
      if (owner.name) {
        return this.client.getUsers(owner.name).then((user) => {
          snippet.contact.name = user.name;
          snippet.contact.email = user.email;
        }).catch((err) => {
          // Just ignore, this was value-added contact.email
          snippet.contact.email = '';
        });
      }
    }).then(() => {
      return [snippet];
    });
  }

  fetchCodeJsonReleases (project) {
    // TODO :: More programmatic way to determine this?
    const url = 'https://raw.githubusercontent.com/' +
        project.full_name + '/master/code.json';

    return fetch(url).then((response) => {
      return response.json();
    });
  }

  /**
   * Filter function to remove projects that should not be included as part
   * of inventory. This is a callback function provided to Array.filter
   * method.
   *
   * @param project {Object}
   *     The project summary object returned by the API
   *
   * @return {Boolean}
   *     True if the project should be included in the inventory, false if
   *     the project should be ommitted.
   */
  projectFilter (project) {
    const projectName = project.full_name;

    if (project.fork) {
      return false; // This is a fork, skip it
    }

    // Not found in this.excludes --> include in inventory
    return (this.excludes.indexOf(projectName) === -1);
  }

  setClient (endpoint) {
    this.client = new GitHubClient(endpoint);
  }
}


module.exports = GitHubInventoryFactory;
