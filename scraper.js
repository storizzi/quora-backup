const fs = require('fs');
const path = require('path');
const { cleanHtml, sanitizeFilename } = require('./utils');
const { saveAnswerContent } = require('./contentWriter');

const escapeQuotes = (text) => {
  return text.replace(/"/g, '\\"').replace(/'/g, "\\'");
};

const scrapeAnswers = async (page, quoraUsername, existingAnswers, template, config) => {
  const { numItems, maxRetries, scrollTimeout, answerClickMs, consoleOutput, debugHtml } = config;
  let retries = 0;
  const results = [...existingAnswers];
  const existingTitles = new Set(existingAnswers.map(answer => answer.question));
  let newItemsCount = 0;
  let checkedItemsCount = 0;

  while (newItemsCount < numItems && retries < maxRetries) {
    const titleElements = await page.$$('div[class^="QuestionTitle"]');
    let checkedItemsCountBefore = checkedItemsCount;

    for (const elementHandle of titleElements) {
      if (newItemsCount >= numItems) break;

      const title = await elementHandle.innerText();
      if (!existingTitles.has(title)) {
        try {
          await elementHandle.click();
          await page.waitForTimeout(answerClickMs);

          const escapedTitle = escapeQuotes(title);
          const newElementHandle = await page.$(`div[class^="QuestionTitle"]:has-text("${escapedTitle}")`);
          if (newElementHandle) {
            const parentDiv = await newElementHandle.$('xpath=../../../../../..');
            if (debugHtml) {
              const parentHtml = await parentDiv.innerHTML();
              console.log(`Debug HTML for title: ${title}\n${parentHtml}`);
            }
            const linkHandle = await parentDiv.$('a');
            if (linkHandle) {
              let url = await linkHandle.getAttribute('href');
              url += `/answer/${quoraUsername}`;
              results.push({ question: title, url });
              existingTitles.add(title);
              newItemsCount++;
              checkedItemsCount++;

              if (consoleOutput) {
                console.log(`Title: ${title}`);
                console.log(`URL: ${url}`);
              }
            } else {
              console.log(`Link not found for title: ${title}`);
            }
          } else {
            console.log(`Element not found for title: ${title}`);
          }
        } catch (error) {
          console.log(`Failed to extract URL for title: ${title}`, error);
        }
      } else {
        checkedItemsCount++;
      }
    }

    console.log(`Collected ${newItemsCount} new unique titles so far.`);

    if (newItemsCount >= numItems) break;

    let previousHeight = await page.evaluate('document.body.scrollHeight');
    await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
    await page.waitForTimeout(scrollTimeout);
    let newHeight = await page.evaluate('document.body.scrollHeight');

    if (newHeight === previousHeight) {
      console.log('No more content to load.');
      break;
    }

    if (numItems > 0 && checkedItemsCount === checkedItemsCountBefore) retries++;
  }

  if (newItemsCount >= numItems) {
    console.log('Successfully collected the required number of new items.');
  } else if (retries >= maxRetries) {
    console.log('Exited due to exceeding the maximum number of retries.');
  }

  return { results, newItemsCount };
};

module.exports = { scrapeAnswers };
