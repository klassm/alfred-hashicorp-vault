#!/usr/local/bin/node
const nodeVault = require("node-vault");
const alfy = require("alfy");
const {groupBy} = require("lodash/collection");

const vaultUrl = alfy.config.get("vaultUrl");
const vaultToken = alfy.config.get("vaultToken");

const vault = nodeVault({
  apiVersion: 'v1',
  endpoint: vaultUrl,
  token: vaultToken,
  noCustomHTTPVerbs: true
})

async function getValuesFor(metadata) {
  const result = await vault.read(`secret/data/${metadata}`);
  return result.data.data;
}

function valuesToCredentials(values) {
  const stringValues = Object.entries(values)
  .filter(([_, value]) => typeof value === "string");
  const groups = groupBy(stringValues,
      ([key]) =>
          key
          .replace(/user(name)?/i, "")
          .replace(/pass(word)?/i, "")
  );
  const credentials = Object.values(groups).filter(group => group.length === 2);
  return credentials
  .map(values => {
    const user = values.find(([key]) => key.toLowerCase().includes("user"));
    const password = values.find(([key]) => key.toLowerCase().includes("pass"));
    const key = user[0].replace(/user(name)?/i, "").replace(/_$/, "");
    return user && password ? {key, username: user[1], password: password[1]}
        : undefined;
  })
  .filter((it) => !!it)
}

async function listCredentials() {
  const [metadata, query] = alfy.input.split(" ").map(it => it.trim());

  const values = await getValuesFor(metadata);
  const credentials = valuesToCredentials(values);
  const result = credentials.map(credential => ({
    title: credential.key,
    arg: JSON.stringify(credential)
  }));
  const filtered = result.filter(
      item => !query || item.title.toLowerCase().includes(query.toLowerCase()));

  alfy.output(filtered);
}

void listCredentials();
