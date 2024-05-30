const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { scrapeAnswers } = require('./scraper');
const { saveAnswerContent } = require('./contentWriter');

const backupQuora = async (config) => {
  const quoraUsername = config.quoraUsername;

  const profileUrl = `https://www.quora.com/profile/${quoraUsername}/answers`;

  const contentDir = path.join(process.cwd(), quoraUsername);
  const answersFilePath = path.join(contentDir, 'answers.json');
  let existingAnswers = [];

  if (fs.existsSync(answersFilePath)) {
    const data = fs.readFileSync(answersFilePath, 'utf8');
    existingAnswers = JSON.parse(data);
  }

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(profileUrl, { waitUntil: 'networkidle' });

  const { numItems, includeAnswerText, templateFilename } = config;

  let template = '';
  try {
    const templatePath = path.join(process.cwd(), templateFilename);
    template = fs.readFileSync(templatePath, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') {
      try {
        const templatePath = path.join(__dirname, templateFilename);
        template = fs.readFileSync(templatePath, 'utf8');
      } catch (innerError) {
        console.error(`Failed to read template file: ${templateFilename}`, innerError);
        process.exit(1);
      }
    } else {
      console.error(`Failed to read template file: ${templateFilename}`, error);
      process.exit(1);
    }
  }

  const { results, newItemsCount } = await scrapeAnswers(page, quoraUsername, existingAnswers, template, config);

  if (newItemsCount > 0) {
    fs.mkdirSync(contentDir, { recursive: true });
    fs.writeFileSync(answersFilePath, JSON.stringify(results, null, 2));
  }

  if (includeAnswerText) {
    const { results: updatedResults, totalWriteCounts, totalFailureCounts } = await saveAnswerContent(context, results, existingAnswers, template, config);
    fs.writeFileSync(answersFilePath, JSON.stringify(updatedResults, null, 2));

    console.log(`Total files written: HTML (${totalWriteCounts.html}), Markdown (${totalWriteCounts.md}), Raw HTML (${totalWriteCounts.raw_html})`);
    if (totalFailureCounts.html > 0 || totalFailureCounts.md > 0 || totalFailureCounts.raw_html > 0) {
      console.error(`Failures: HTML (${totalFailureCounts.html}), Markdown (${totalFailureCounts.md}), Raw HTML (${totalFailureCounts.raw_html})`);
    }
  } else {
    console.log('Skipping saving answer text content.');
  }

  if (config.consoleOutput) {
    console.log(`First ${newItemsCount} new unique answer titles with URLs:`, results);
  }

  await browser.close();
};

module.exports = {
  backupQuora,
};
