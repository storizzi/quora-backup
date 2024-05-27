const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { formatUsername } = require('./utils');

const loadEnv = () => {
  const envPath = path.join(process.cwd(), '.env');
  const scriptEnvPath = path.join(__dirname, '.env');

  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  } else if (fs.existsSync(scriptEnvPath)) {
    dotenv.config({ path: scriptEnvPath });
  }
};

loadEnv();

const getBooleanValue = (value, defaultValue) => {
  if (value === undefined) return defaultValue;
  return ['true', 'yes', '1', 'on'].includes(value.toLowerCase());
};

const getConfig = (cliArgs) => {
  const rawUsername = cliArgs.quoraUsername || process.env.QUORA_USERNAME || '';
  const formattedUsername = formatUsername(rawUsername);

  const cliConfig = {
    quoraUsername: formattedUsername,
    numItems: cliArgs.numItems !== undefined ? parseInt(cliArgs.numItems, 10) : parseInt(process.env.NUM_ITEMS, 10) || 10,
    maxRetries: cliArgs.maxRetries !== undefined ? parseInt(cliArgs.maxRetries, 10) : parseInt(process.env.MAX_RETRIES, 10) || 20,
    scrollTimeout: cliArgs.scrollTimeout !== undefined ? parseInt(cliArgs.scrollTimeout, 10) : parseInt(process.env.SCROLL_TIMEOUT_MS, 10) || 30000,
    answerClickMs: cliArgs.answerClickMs !== undefined ? parseInt(cliArgs.answerClickMs, 10) : parseInt(process.env.ANSWER_CLICK_MS, 10) || 300,
    consoleOutput: cliArgs.consoleOutput !== undefined ? getBooleanValue(cliArgs.consoleOutput, false) : getBooleanValue(process.env.CONSOLE_OUTPUT, false),
    debugHtml: cliArgs.debugHtml !== undefined ? getBooleanValue(cliArgs.debugHtml, false) : getBooleanValue(process.env.DEBUG_HTML, false),
    includeAnswerText: cliArgs.includeAnswerText !== undefined ? getBooleanValue(cliArgs.includeAnswerText, false) : getBooleanValue(process.env.INCLUDE_ANSWER_TEXT, false),
    templateFilename: cliArgs.templateFilename || process.env.HTML_TEMPLATE_FILENAME || 'template.html',
    htmlWidth: cliArgs.htmlWidth !== undefined ? parseInt(cliArgs.htmlWidth, 10) : parseInt(process.env.HTML_WIDTH, 10) || 80,
    outputHtmlFiles: cliArgs.outputHtmlFiles !== undefined ? getBooleanValue(cliArgs.outputHtmlFiles, true) : getBooleanValue(process.env.OUTPUT_HTML_FILES, true),
    outputMarkdownFiles: cliArgs.outputMarkdownFiles !== undefined ? getBooleanValue(cliArgs.outputMarkdownFiles, true) : getBooleanValue(process.env.OUTPUT_MARKDOWN_FILES, true),
  };

  if (!formattedUsername) {
    throw new Error('Quora username is not provided');
  }

  return cliConfig;
};

module.exports = {
  getConfig,
};
