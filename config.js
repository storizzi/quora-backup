const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { formatUsername } = require('./utils');

const loadEnv = () => {
  const defaultEnvConfig = {
    QUORA_USERNAME: '',
    NUM_ITEMS: 10,
    MAX_RETRIES: 20,
    SCROLL_TIMEOUT_MS: 1000,
    ANSWER_CLICK_MS: 300,
    CONSOLE_OUTPUT: 'false',
    DEBUG_HTML: 'false',
    INCLUDE_ANSWER_TEXT: 'true',
    HTML_TEMPLATE_FILENAME: 'template.html',
    HTML_WIDTH: 80,
    OUTPUT_HTML_FILES: 'true',
    OUTPUT_MARKDOWN_FILES: 'true'
  };

  const envConfig = {};
  const envPaths = {
    scriptEnvPath: '',
    currentEnvPath: ''
  };

  const loadEnvFile = (envPath, envName) => {
    if (fs.existsSync(envPath)) {
      const env = dotenv.parse(fs.readFileSync(envPath));
      Object.assign(envConfig, env);
      envPaths[envName] = env;
    }
  };

  const scriptEnvPath = path.join(__dirname, '.env');
  const currentEnvPath = path.join(process.cwd(), '.env');

  // Load environment variables from the source code directory first
  loadEnvFile(scriptEnvPath, 'scriptEnv');

  // Load environment variables from the current working directory, overriding the previous ones
  loadEnvFile(currentEnvPath, 'currentEnv');

  // Merge the loaded environment variables with the process.env, with process.env taking precedence
  const finalEnvConfig = Object.assign({}, defaultEnvConfig, envConfig, process.env);

  // Debugging information
  const debugEnvVars = ['true', 'yes', '1', 'on'].includes((finalEnvConfig.DEBUG_ENV_VARS || '').toLowerCase());
  if (debugEnvVars) {
    console.log("DEBUG_ENV_VARS is enabled. Showing relevant environment variables and their sources:");
    console.log(`Source .env file path: ${scriptEnvPath}`);
    console.log(`Project .env file path: ${currentEnvPath}`);

    const relevantEnvVars = [
      'QUORA_USERNAME', 'NUM_ITEMS', 'MAX_RETRIES', 'SCROLL_TIMEOUT_MS',
      'ANSWER_CLICK_MS', 'CONSOLE_OUTPUT', 'DEBUG_HTML', 'INCLUDE_ANSWER_TEXT',
      'HTML_TEMPLATE_FILENAME', 'HTML_WIDTH', 'OUTPUT_HTML_FILES', 'OUTPUT_MARKDOWN_FILES'
    ];

    relevantEnvVars.forEach((varName) => {
      const defaultValue = defaultEnvConfig[varName];
      const memoryValue = process.env[varName];
      const scriptEnvValue = envPaths.scriptEnv ? envPaths.scriptEnv[varName] : undefined;
      const currentEnvValue = envPaths.currentEnv ? envPaths.currentEnv[varName] : undefined;
      const finalValue = finalEnvConfig[varName];

      console.log(`${varName}:`);
      if (defaultValue !== undefined) console.log(`  Default: ${defaultValue}`);
      if (scriptEnvValue !== undefined) console.log(`  Source .env file: ${scriptEnvValue}`);
      if (currentEnvValue !== undefined) console.log(`  Project .env file: ${currentEnvValue}`);
      if (memoryValue !== undefined) console.log(`  In memory: ${memoryValue}`);
      console.log(`  Final: ${finalValue}`);
    });
  }

  return finalEnvConfig;
};

const finalEnvConfig = loadEnv();

const getBooleanValue = (value) => {
  return ['true', 'yes', '1', 'on'].includes(value.toLowerCase());
};

const getConfig = (cliArgs) => {
  const rawUsername = cliArgs.quoraUsername || finalEnvConfig.QUORA_USERNAME;
  const formattedUsername = formatUsername(rawUsername);

  const cliConfig = {
    quoraUsername: formattedUsername,
    numItems: cliArgs.numItems !== undefined ? parseInt(cliArgs.numItems, 10) : parseInt(finalEnvConfig.NUM_ITEMS, 10),
    maxRetries: cliArgs.maxRetries !== undefined ? parseInt(cliArgs.maxRetries, 10) : parseInt(finalEnvConfig.MAX_RETRIES, 10),
    scrollTimeout: cliArgs.scrollTimeout !== undefined ? parseInt(cliArgs.scrollTimeout, 10) : parseInt(finalEnvConfig.SCROLL_TIMEOUT_MS, 10),
    answerClickMs: cliArgs.answerClickMs !== undefined ? parseInt(cliArgs.answerClickMs, 10) : parseInt(finalEnvConfig.ANSWER_CLICK_MS, 10),
    consoleOutput: cliArgs.consoleOutput !== undefined ? getBooleanValue(cliArgs.consoleOutput) : getBooleanValue(finalEnvConfig.CONSOLE_OUTPUT),
    debugHtml: cliArgs.debugHtml !== undefined ? getBooleanValue(cliArgs.debugHtml) : getBooleanValue(finalEnvConfig.DEBUG_HTML),
    includeAnswerText: cliArgs.includeAnswerText !== undefined ? getBooleanValue(cliArgs.includeAnswerText) : getBooleanValue(finalEnvConfig.INCLUDE_ANSWER_TEXT),
    templateFilename: cliArgs.templateFilename || finalEnvConfig.HTML_TEMPLATE_FILENAME,
    htmlWidth: cliArgs.htmlWidth !== undefined ? parseInt(cliArgs.htmlWidth, 10) : parseInt(finalEnvConfig.HTML_WIDTH, 10),
    outputHtmlFiles: cliArgs.outputHtmlFiles !== undefined ? getBooleanValue(cliArgs.outputHtmlFiles) : getBooleanValue(finalEnvConfig.OUTPUT_HTML_FILES),
    outputMarkdownFiles: cliArgs.outputMarkdownFiles !== undefined ? getBooleanValue(cliArgs.outputMarkdownFiles) : getBooleanValue(finalEnvConfig.OUTPUT_MARKDOWN_FILES),
  };

  if (!formattedUsername) {
    throw new Error('Quora username is not provided');
  }

  return cliConfig;
};

module.exports = {
  getConfig,
};
