'use strict';


const fs = require('fs'),
      https = require('https');

const AbstractClient = require('../core/abstract-client');


class GitLabClient extends AbstractClient {

  constructor (options) {
    super(options);

    this.organization = (options || {}).organization;

    if (this.username && this.password) {
      this.basicAuth = new Buffer(
          this.username + ':' + this.password).toString('base64');
    }
  }

  getContent (owner, repo, path) {
    if (!owner || !repo || !path) {
      return Promise.reject('Owner, repo, and path are all required parameters.');
    }

    return this.fetch(`/repos/${owner}/${repo}/contents/${path}`)
  }

  getFetchHeaders () {
    const headers = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'GitHubApi_fetch'
    };

    if (this.basicAuth) {
      headers.Authorization = `Basic ${this.basicAuth}`;
    }

    return headers;
  }

  /**
   * @param name {String} Optional
   *     The name of the project to get. If ommitted, gets all projects
   *     for the current organization (this.organization).
   *
   */
  getProjects (name) {
    if (name || name === 0) {
      return this.fetch(`/repos/${this.organization}/${name}`);
    } else {
      return this.fetch(
          `/orgs/${this.organization}/repos?per_page=${this.resultsPerPage}`);
    }
  }

  getUsers (name) {
    if (name || name === 0) {
      return this.fetch(`/users/${name}`);
    } else {
      return this.fetch(`/orgs/${this.organization}/members` +
          `?per_page=${this.resultsPerPage}`);
    }
  }
}

module.exports = GitLabClient;
