const fs = require('fs');
const path = require('path');
const { cleanHtml, sanitizeFilename, convertHtmlToMarkdown } = require('./utils');

const writeContent = async (title, cleanedHtml, config, usernameDir) => {
  const cleanedContentDir = path.join(process.cwd(), usernameDir, 'html');
  const markdownContentDir = path.join(process.cwd(), usernameDir, 'md');
  const sanitizedFilename = sanitizeFilename(title) + '.html';

  if (config.outputHtmlFiles) {
    const cleanedFilePath = path.join(cleanedContentDir, sanitizedFilename);
    fs.writeFileSync(cleanedFilePath, cleanedHtml);
  }

  if (config.outputMarkdownFiles) {
    const markdownContent = convertHtmlToMarkdown(cleanedHtml);
    const markdownFilename = sanitizedFilename.replace('.html', '.md');
    const markdownFilePath = path.join(markdownContentDir, markdownFilename);
    fs.writeFileSync(markdownFilePath, markdownContent);
  }
};

const saveAnswerContent = async (context, results, existingAnswers, template, consoleOutput, config, usernameDir) => {
  const rawContentDir = path.join(process.cwd(), usernameDir, 'raw-html');

  if (!fs.existsSync(rawContentDir)) {
    fs.mkdirSync(rawContentDir, { recursive: true });
  }

  if (config.outputHtmlFiles && !fs.existsSync(path.join(process.cwd(), usernameDir, 'html'))) {
    fs.mkdirSync(path.join(process.cwd(), usernameDir, 'html'), { recursive: true });
  }

  if (config.outputMarkdownFiles && !fs.existsSync(path.join(process.cwd(), usernameDir, 'md'))) {
    fs.mkdirSync(path.join(process.cwd(), usernameDir, 'md'), { recursive: true });
  }

  console.log('Saving answer text content to:', rawContentDir, config.outputHtmlFiles ? 'and' : '', config.outputHtmlFiles ? path.join(process.cwd(), usernameDir, 'html') : '', config.outputMarkdownFiles ? 'and' : '', config.outputMarkdownFiles ? path.join(process.cwd(), usernameDir, 'md') : '');

  for (const result of results) {
    if (!existingAnswers.some(answer => answer.question === result.question)) {
      const answerPage = await context.newPage();
      await answerPage.goto(result.url, { waitUntil: 'networkidle' });

      try {
        const contentHandles = await answerPage.$$('span.qu-userSelect--text');
        if (contentHandles.length > 1) {
          const contentHandle = contentHandles[1];
          const childElements = await contentHandle.evaluate(node => node.children.length);
          if (childElements > 0) {
            const rawHtml = await contentHandle.innerHTML();
            const sanitizedFilename = sanitizeFilename(result.question) + '.html';
            const rawFilePath = path.join(rawContentDir, sanitizedFilename);
            fs.writeFileSync(rawFilePath, rawHtml);

            const cleanedHtml = await cleanHtml(rawHtml, result.question, template, config.htmlWidth);
            await writeContent(result.question, cleanedHtml, config, usernameDir);

            if (consoleOutput) {
              console.log(`Saved content for: ${result.question} to ${rawFilePath}${config.outputHtmlFiles ? ' and ' + path.join(process.cwd(), usernameDir, 'html', sanitizedFilename) : ''}${config.outputMarkdownFiles ? ' and ' + path.join(process.cwd(), usernameDir, 'md', sanitizedFilename.replace('.html', '.md')) : ''}`);
            }
          } else {
            console.log(`Content does not have child elements for URL: ${result.url}`);
          }
        } else {
          console.log(`Answer not found for URL: ${result.url}`);
        }
      } catch (error) {
        console.log(`Failed to extract content for URL: ${result.url}`, error);
      } finally {
        await answerPage.close();
      }
    }
  }
};

module.exports = { saveAnswerContent, writeContent };