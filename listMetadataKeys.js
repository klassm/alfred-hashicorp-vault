#!/usr/local/bin/node
const nodeVault = require("node-vault");
const alfy = require("alfy");

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
  return result.data.data
}

function formatValue(value) {
  const type = typeof value;
  if (type === "string") {
    return value.trim();
  }
  if (type === "object") {
    return JSON.stringify(value);
  }

  return value;
}

async function listAll() {
  const [metadata, query] = alfy.input.split(" ").map(it => it.trim());

  const values = await getValuesFor(metadata);
  const result = Object.entries(values).map(([key, value]) => ({
    title: key,
    subtitle: metadata,
    arg: formatValue(value)
  }));
  const filtered = result.filter(
      item => !query || item.title.toLowerCase().includes(query.toLowerCase()));

  alfy.output(filtered);
}

void listAll();
