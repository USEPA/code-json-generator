'use strict';

const fetch = require('node-fetch');

const GitLabClient = require('./client'),
      AbstractInventoryFactory = require('../core/abstract-inventory-factory');


class GitLabInventoryFactory extends AbstractInventoryFactory {

  constructor (config, endpoint) {
    super(config, endpoint);

    config = config || {};
    this.pendingFetchCount = 0;
    this.maxFetchCount = config.maxFetchCount || 10;
  }

  augmentRelease (release, project) {
    // TODO
    return release;
  }

  correctCodeJsonErrors (release, project) {
    const corrected = super.correctCodeJsonErrors(release, project);

    if (project.visibility !== 'public') {
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
    const isPublic = (!this.isPrivate && project.visibility === 'public');
    const url = project.web_url;

    const tags = project.tag_list || [];
    if (tags.indexOf('usgs') === -1) {
      tags.push('usgs');
    }

    const owner = project.owner || {};

    const snippet = {
      'name': project.path_with_namespace,
      'organization': 'U.S. Geological Survey',
      'description': project.description || '',
      // TODO :: Check .../projects/:id/repository/tags ???
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
      'downloadURL': isPublic ? `${url}/repository/master/archive.zip` : '',
      'disclaimerURL': isPublic ? `${url}/blob/master/DISCLAIMER.md` : '',
      'repositoryURL': isPublic ? `${project.http_url_to_repo}/` : '',
      'vcs': 'git',

      'laborHours': 0,
      'tags': tags,
      'languages': [],

      'contact': {
        'name': owner.name
      },
      'date': {
        'created': project.created_at,
        'lastModified': project.last_activity_at,
        'metadataLastUpdated': (new Date()).toISOString()
      }
    };

    return Promise.resolve().then(() => {
      if (owner.id || owner.id === 0) {
        if (this.pendingFetchCount < this.maxFetchCount) {
          this.pendingFetchCount++;
          return this.client.fetch(`/api/v4/users/${owner.id}`).then((user) => {
            snippet.contact.name = user.name;
            snippet.contact.email = user.email;
            this.pendingFetchCount--;
          }).catch((err) => {
            // Just ignore, this was value-added contact.email
            snippet.contact.email = '';
            this.pendingFetchCount--;
          });
        } else {
          process.stderr.write(`Concurrent fetch limit reached.\n`);
          snippet.contact.email = `${owner.username}@usgs.gov`;
        }
      }
    }).then(() => {
      return [snippet];
    });
  }

  fetchCodeJsonReleases (project) {
    const url = `${project.web_url}/raw/master/code.json`;

    return fetch(url).then((response) => {
      try {
        return response.json();
      } catch (err) {
        console.log(url, err.message);
        throw err;
      }
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
    const projectName = project.path_with_namespace;

    if (project.hasOwnProperty('forked_from_project')) {
      process.stderr.write(
        `Skipping project "${projectName}" because it is a fork.\n`);
      return false; // This is a fork, skip it
    }

    if (project.namespace.kind === 'user') {
      process.stderr.write(
        `Skipping project "${projectName}" because it is personal.\n`);
      return false; // This is a personal project, skip it
    }

    // Not found in this.excludes --> include in inventory
    return (this.excludes.indexOf(projectName) === -1);
  }

  setClient (endpoint) {
    this.client = new GitLabClient(endpoint);
  }
}


module.exports = GitLabInventoryFactory;
