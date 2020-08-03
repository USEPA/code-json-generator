'use strict';


const querystring = require('querystring');

const AbstractClient = require('../core/abstract-client');


class GitLabApi extends AbstractClient {

  getFetchHeaders () {
    const headers = {};

    headers['User-Agent'] = 'GitLabApi_fetch';
    if (this.password) {
      headers['Private-Token'] = this.password;
    }

    return headers;
  }

  getProjects (id, query) {
    if (id || id === 0) {
      return this.fetch(`/api/v4/projects/${id}/?per_page=${this.resultsPerPage}`);
    } else {
      query = querystring.encode(query || {});
      return this.fetch(`/api/v4/projects/?per_page=${this.resultsPerPage}&${query}`);
    }
  }

  getUsers (id) {
    if (id || id === 0) {
      return this.fetch(`/api/v4/users/${id}/?per_page=${this.resultsPerPage}`);
    } else {
      return this.fetch(`/api/v4/users/?per_page=${this.resultsPerPage}`);
    }
  }
}

module.exports = GitLabApi;
