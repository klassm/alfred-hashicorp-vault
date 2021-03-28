#!/usr/local/bin/node
const alfy = require("alfy");
const {execSync} = require("child_process");

const vaultUrl = alfy.config.get("vaultUrl");

execSync(`open ${vaultUrl}/ui/vault/secrets/secret/show/${alfy.input}`);
