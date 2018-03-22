'use strict';


const fs = require('fs'),
      https = require('https');


const ABSTRACT_WARNING = 'Abstract method "{{NAME}}" should not be called.';


class AbstractClient {

  constructor (options) {
    options = options || {};

    this.host = options.host;

    this.username = options.username;
    this.password = options.password;

    if (options.cacert) {
      if (!fs.existsSync(options.cacert)) {
        process.stderr.write(`Specified cacert ${options.cacert} does ` +
            'not exist. Proceeding without cacert.\n');
      } else {
        this.ca = fs.readFileSync(options.cacert);
      }
    }

    this.resultsPerPage = 100;
  }

  // --------------------------------------------------
  // API Methods
  // --------------------------------------------------

  // --------------------------------------------------
  // Abstract Methods
  // --------------------------------------------------

  getContent (owner, repo, path) {
    throw new Error(ABSTRACT_WARNING.replace('{{NAME}}', 'getContent'));
  }

  getFetchHeaders () {
    throw new Error(ABSTRACT_WARNING.replace('{{NAME}}', 'getFetchHeaders'));
  }

  getProjects (id) {
    throw new Error(ABSTRACT_WARNING.replace('{{NAME}}', 'getProjects'));
  }

  getUsers (id) {
    throw new Error(ABSTRACT_WARNING.replace('{{NAME}}', 'getUsers'));
  }


  // --------------------------------------------------
  // Helper Methods
  // --------------------------------------------------

  /**
   * @param path {String}
   *     URL path to API endpoint
   *
   * @return {Object}
   */
  fetch (path, data) {
    data = data || [];

    return new Promise((resolve, reject) => {
      const requestOptions = {
        headers: this.getFetchHeaders(),
        host: this.host,
        path: path
      };

      if (this.ca) {
        requestOptions.ca = this.ca
      }

      const request = https.get(requestOptions);

      request.once('response', (response) => {
        const buffer = [];
        const links = this.parseLinks(response.headers.link);

        response.on('data', (chunk) => {
          buffer.push(chunk);
        });

        response.on('end', () => {
          data = data.concat(JSON.parse(buffer.join('')));

          if (links.next) {
            resolve(this.fetch(links.next, data));
          } else {
            resolve(data);
          }
        });
      });

      request.on('error', (error) => {
        reject(error);
      });

      request.end();
    });
  }

  parseLinkRel (rel) {
    const parts = rel.split('=');
    return parts[1].replace(/"/g, '');
  }

  parseLinkUrl (url) {
    return url.replace('<https://' + this.host, '').replace(/>/g, '').trim();
  }

  parseLinks (links) {
    const result = {};

    links = links || '';

    links.split(',').forEach((link) => {
      const parts = link.split(';');
      let url = parts[0];
      let rel = parts[1];

      if (url && rel) {
        rel = this.parseLinkRel(rel);
        url = this.parseLinkUrl(url);

        result[rel] = url;
      }
    });

    return result;
  }
}

module.exports = AbstractClient;
