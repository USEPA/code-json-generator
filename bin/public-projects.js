#!/usr/bin/env node
'use strict';

//////
//
// This script generates a list of public projects hosted in GitLab. The list
// may be output in either HTML or MD formats. This is intended to be a
// short-term gap-fill while GitLab has disabled the /public and /explore
// pages on the platform when the "public" visibility is restricted [to
// administrators].
//
// See: https://gitlab.com/gitlab-org/gitlab/-/issues/231381
//
//////

const commander = require('commander'),
  inquirer = require('inquirer'),
  fs = require('fs');

const pkgJson = require('../package.json');

const GitLabClient = require('../lib/gitlab/client');
const { exception } = require('console');
const { command } = require('commander');

const FORMAT_MARKDOWN = 'md';
const FORMAT_HTML = 'html';
const FORMATS = [FORMAT_MARKDOWN, FORMAT_HTML];

const TITLE = 'USGS Public Project Explorer';

const formatProject = function (project) {
  const markup = [
    `**[${project.name_with_namespace}](${project.web_url})**\n`,
    `_Updated: ${project.last_activity_at}_`
  ];

  if (project.tag_list && project.tag_list.length) {
    markup.push(`\n_Tags: ${project.tag_list.join(' | ')}_`);
  }

  if (project.description) {
    markup.push(`\n \n${project.description}`);
  }


  return markup.join('') + '\n ___\n ';
};

if (require.main === module) {
  commander
    .version(pkgJson.version)
    .option('-c, --cacert [cacert]', 'SSL certificate authority bundle')
    .option('--host <host>', 'GitLab hostname')
    .option('--output [file]', 'File where output is written. Default: STDOUT')
    .option('--password [password]', 'Password for authenticated requests')
    .parse(process.argv);

  let client = null;

  Promise.resolve().then(() => {
    if (command.password) {
      process.stderr.write('Providing password on the command line is insecure.\n');
      return commander.password;
    } else if (process.env.hasOwnProperty('API_PRIVATE_TOKEN')) {
      return process.env['API_PRIVATE_TOKEN'];
    } else {
      return inquirer
        .prompt([
          {
            type: 'password',
            name: 'password',
            message: 'Password for authenticated requests'
          }
        ])
        .then(answers => answers.password);
    }
  }).then(password => {
    commander.password = password;
    client = new GitLabClient(commander);
    // Pre-filter to public projects. Fewer API calls, less data xfer, etc...
    return client.getProjects(null, {visibility: 'public'});
  }).then(projects => {
    projects.sort((a, b) => {
      if (a.name_with_namespace > b.name_with_namespace) {
        return 1;
      } else {
        return -1;
      }
    });

    let writeStream = process.stdout;

    if (commander.output) {
      process.stderr.write(`Sending output to ${commander.output}\n`);
      writeStream = fs.createWriteStream(commander.output, {flags: 'w'});
    }

    writeStream.write(
      `# ${TITLE}\n\n ` +
      projects.map(item => formatProject(item)).join('') +
      `> ${projects.length} Total Public Projects\n` +
      `> Last Updated: ${new Date().toUTCString()}`
    , () => {
      if (commander.output) {
        writeStream.end();
      }
    });
  });
}