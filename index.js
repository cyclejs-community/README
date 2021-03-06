import {run} from '@cycle/xstream-run';
import {makeHTTPDriver} from '@cycle/http';
import xs from 'xstream';
import delay from 'xstream/extra/delay';
import flattenSequentially from 'xstream/extra/flattenSequentially';
import process from 'process';
import fs from 'fs';

const CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const SECRET_KEY = process.env.GITHUB_SECRET_KEY;
const README_PREFACE = fs.readFileSync('README_SOURCE.md', 'utf-8');

const GENERATED_WARNING = `<!-- This file was automatically generated by index.js. If you wish to change the README text, please change README_SOURCE.md -->`;

if (!CLIENT_ID || !SECRET_KEY) {
  console.log('Please ensure $GITHUB_CLIENT_ID and $GITHUB_SECRET_KEY are set');
}

function apiCall (path) {
  return `https://api.github.com/${path}?client_id=${CLIENT_ID}&client_secret=${SECRET_KEY}`
}

function prettyIssue (issue) {
  return `* [#${issue.number} - ${issue.title}](${issue.html_url})`
}

function prettyIssues (issues) {
  return (
    Object.keys(issues).map(repoName => (
      [
        `**${repoName}**`,
        issues[repoName].map(prettyIssue).join('\n')
      ].join('\n')
    )).join('\n\n')
  );
}

function readmeDriver (sink$) {
  sink$.addListener({
    next (issues) {
      fs.writeFileSync(
        'README.md',
        [
          GENERATED_WARNING,
          README_PREFACE,
          prettyIssues(issues),
          '\n',
          GENERATED_WARNING
        ].join('\n')
      );
    },

    error (err) {
      console.error(err);
    },

    complete () {
      console.log('done!')
    }
  });
}

function labeledWithHelp (issue) {
  const labels = issue.labels.map(label => label.name);

  return labels
    .map(label => label.toLowerCase())
    .some(label => label.includes('help') || label.includes('pr-welcome'));
}

function addIssues (issuesByRepo, issues) {
  const issuesLabeledWithHelp = issues.filter(labeledWithHelp);

  if (issuesLabeledWithHelp.length === 0) {
    return issuesByRepo;
  }

  const repoName = issuesLabeledWithHelp[0].repository_url
    .replace('https://api.github.com/repos/cyclejs-community/', '');

  issuesByRepo[repoName] = issuesLabeledWithHelp;

  return issuesByRepo;
}

function main ({HTTP}) {
  const repoIssueURLs$ = HTTP
    .select('repos')
    .flatten()
    .map(response => response.body)
    .map(repos => repos.map(
      repo => repo.issues_url.replace(
        '{/number}',
        `?client_id=${CLIENT_ID}&client_secret=${SECRET_KEY}&assignee=none&state=open`
      )
    ));

  const issues$ = HTTP
    .select('issues')
    .compose(flattenSequentially)
    .map(response => response.body)
    .fold(addIssues, {});

  const fetchRepos$ = xs.of({
    url: apiCall('orgs/cyclejs-community/repos'),
    category: 'repos'
  });

  const fetchIssues$ = repoIssueURLs$
    .map(urls =>
      urls.map(url => ({
        url,
        category: 'issues'
      }))
    )
    .map(requests => xs.of(
      ...requests.map(request => xs.of(request).compose(delay(1000)))
    ))
    .flatten()
    .compose(flattenSequentially);

  const request$ = xs.merge(fetchRepos$, fetchIssues$);

  return {
    HTTP: request$,
    README: issues$
  };
}

const drivers = {
  HTTP: makeHTTPDriver(),
  README: readmeDriver
};

run(main, drivers);
