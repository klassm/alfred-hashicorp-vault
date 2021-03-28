#!/usr/local/bin/node
const nodeVault = require("node-vault");
const _ = require("lodash");
const alfy = require("alfy");

const vaultUrl = alfy.config.get("vaultUrl");
const vaultToken = alfy.config.get("vaultToken");

const vault = nodeVault({
  apiVersion: 'v1',
  endpoint: vaultUrl,
  token: vaultToken,
  noCustomHTTPVerbs: true
})

async function listAllIn(path) {
  try {
    const result = await vault.list(`secret/metadata/${path}`)
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

async function listAllSecrets(path = "") {
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
    return _.uniq(
        [
          part, acronym, ...subParts
        ].filter(it => it)
    );
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
    arg: option,
    autocomplete: option,
    match: matchOptionsFor(option).join(" ")
  }
}

async function getAllSecrets() {
  const secrets = alfy.cache.get("secrets");
  if (secrets && secrets.length > 0) {
    return secrets;
  }
  const newSecrets = await listAllSecrets();
  alfy.cache.set("secrets", newSecrets, {maxAge: 1000 * 60 * 60});
  return newSecrets;
}

async function listAllForAlfred() {
  const secrets = await getAllSecrets();
  const options = secrets.map(toAlfred);
  alfy.output(options);
}

void listAllForAlfred();
