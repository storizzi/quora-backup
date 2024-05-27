#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const rimraf = require('rimraf');
const { chromium } = require('playwright');
const { getConfig } = require('./config');
const { backupQuora } = require('./quora-backup');

const args = process.argv.slice(2);

const runInstallDependencies = () => {
  const scriptPath = path.join(__dirname, 'install_dependencies.sh');
  if (fs.existsSync(scriptPath)) {
    execSync(`sh ${scriptPath}`, { stdio: 'inherit' });
  } else {
    console.error('install_dependencies.sh script not found.');
    process.exit(1);
  }
};

const runClean = (username) => {
  const config = getConfig({ quoraUsername: username });
  const formattedUsername = config.quoraUsername;

  if (!formattedUsername) {
    console.error('No username provided.');
    process.exit(1);
  }

  const contentDir = path.join(process.cwd(), formattedUsername);
  const answersFilePath = path.join(contentDir, 'answers.json');

  // Remove content directory
  if (fs.existsSync(contentDir)) {
    rimraf.sync(contentDir);
    console.log(`${contentDir} directory removed.`);
  }

  // Remove JSON file
  if (fs.existsSync(answersFilePath)) {
    fs.unlinkSync(answersFilePath);
    console.log('JSON file removed.');
  }
};

const runBackup = (cliArgs) => {
  try {
    const config = getConfig(cliArgs);
    backupQuora(config);
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
};

const runTest = async () => {
  try {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    await page.goto('https://www.quora.com');
    await page.close();
    await browser.close();
    console.log('Playwright and Chromium are installed correctly.');
    process.exit(0);
  } catch (error) {
    console.error('Playwright or Chromium is not installed correctly.', error);
    process.exit(1);
  }
};

if (args[0] === 'install') {
  runInstallDependencies();
} else if (args[0] === 'clean') {
  runClean(args[1]);
} else if (args[0] === 'test') {
  runTest();
} else if (args[0]) {
  runBackup({ quoraUsername: args[0] });
} else if (getConfig({}).quoraUsername) {
  runBackup({ quoraUsername: getConfig({}).quoraUsername });
} else {
  runTest();
}
