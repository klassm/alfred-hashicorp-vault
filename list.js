#!/usr/local/bin/node
const nodeVault = require("node-vault");
const process = require("process");
const _ = require("lodash");
const fs = require("fs");

const homedir = require('os').homedir();
const xdgConfigHome = process.env.XDG_CONFIG_HOME;
const baseDir = xdgConfigHome ?? homedir;
const filePath = `${baseDir}/.alfred-vault.json`;
const {token, url} = JSON.parse(fs.readFileSync(filePath));

const vault = nodeVault({
  apiVersion: 'v1',
  endpoint: url,
  token,
  noCustomHTTPVerbs: true
})

async function listAllIn(path) {
  try {
    const result = await vault.list(`secret/metadata${path}`)
    const collection = result.data.keys.map(
        key => path + key);
    const groups = _.groupBy(collection,
        entry => entry.endsWith("/") ? "paths" : "secrets");
    return {
      paths: [],
      secrets: [],
      ...groups
    }
  } catch (e) {
    return {paths: [], secrets: []};
  }
}

async function listAllSecrets(path = "/") {
  const result = await listAllIn(path);
  const secretsFromPaths = (await Promise.all(
      result.paths.flatMap(foundPath => listAllSecrets(foundPath))))
  .flatMap(it => it);
  return [...secretsFromPaths, ...result.secrets];
}

function matchOptionsFor(option) {
  const optionParts = option.split("/");
  return optionParts.flatMap(part => {
    const subParts = part.split(/[-_]/g);
    const acronym = subParts.length >= 3
        ? subParts.map(part => part.charAt(0)).join("")
        : undefined;
    return [
      part, acronym, ...subParts
    ].filter(it => it);
  })
}

function titleFor(option) {
  const optionParts = option.split("/");
  return optionParts.slice(optionParts.length - 2).join(" ");
}

function toAlfred(option) {
  return {
    uid: option,
    title: titleFor(option),
    subtitle: option,
    arg: `${url}/ui/vault/secrets/secret/show${option}`,
    autocomplete: option,
    match: matchOptionsFor(option).join(" ")
  }
}

async function listAllForAlfred() {
  const secrets = await listAllSecrets();
  const options = secrets.map(toAlfred);
  console.log(JSON.stringify({items: options}));
}

void listAllForAlfred();
