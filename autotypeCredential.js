#!/usr/local/bin/node
const process = require("child_process");
const alfy = require("alfy");
const {username, password} = JSON.parse(alfy.input);

process.execSync(`echo 'tell application "System Events" to keystroke "${username}"' | osascript`)
process.execSync(`echo 'tell application "System Events" to key code "48"' | osascript`) // tab
process.execSync(`echo 'tell application "System Events" to keystroke "${password}"' | osascript`)


