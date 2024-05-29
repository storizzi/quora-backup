const fs = require('fs');
const path = require('path');
const { cleanHtml, sanitizeFilename, convertHtmlToMarkdown } = require('./utils');

const writeContent = async (title, cleanedHtml, config, usernameDir) => {
  const cleanedContentDir = path.join(process.cwd(), usernameDir, 'html');
  const markdownContentDir = path.join(process.cwd(), usernameDir, 'md');
  const sanitizedFilename = sanitizeFilename(title) + '.html';
  const filePaths = {};

  let writeCounts = {
    html: 0,
    md: 0,
    raw_html: 0,
  };
  let failureCounts = {
    html: 0,
    md: 0,
    raw_html: 0,
  };

  if (config.outputHtmlFiles) {
    const cleanedFilePath = path.join(cleanedContentDir, sanitizedFilename);
    fs.writeFileSync(cleanedFilePath, cleanedHtml);
    if (fs.existsSync(cleanedFilePath)) {
      filePaths.html = path.relative(process.cwd(), cleanedFilePath);
      writeCounts.html++;
    } else {
      failureCounts.html++;
    }
  }

  if (config.outputMarkdownFiles) {
    const markdownContent = convertHtmlToMarkdown(cleanedHtml);
    const markdownFilename = sanitizedFilename.replace('.html', '.md');
    const markdownFilePath = path.join(markdownContentDir, markdownFilename);
    fs.writeFileSync(markdownFilePath, markdownContent);
    if (fs.existsSync(markdownFilePath)) {
      filePaths.md = path.relative(process.cwd(), markdownFilePath);
      writeCounts.md++;
    } else {
      failureCounts.md++;
    }
  }

  return { filePaths, writeCounts, failureCounts };
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

  let totalWriteCounts = {
    html: 0,
    md: 0,
    raw_html: 0,
  };
  let totalFailureCounts = {
    html: 0,
    md: 0,
    raw_html: 0,
  };

  for (const result of results) {
    const existingAnswer = existingAnswers.find(answer => answer.question === result.question);
    let needsUpdate = false;
    let rawHtml = '';

    if (existingAnswer) {
      // Check for missing files
      if (config.retryFailedContent) {
        if (!existingAnswer.files || !existingAnswer.files.raw_html || !fs.existsSync(path.join(process.cwd(), existingAnswer.files.raw_html))) {
          needsUpdate = true;
        } else {
          rawHtml = fs.readFileSync(path.join(process.cwd(), existingAnswer.files.raw_html), 'utf8');
        }
        if (config.outputHtmlFiles && (!existingAnswer.files || !existingAnswer.files.html || !fs.existsSync(path.join(process.cwd(), existingAnswer.files.html)))) {
          needsUpdate = true;
        }
        if (config.outputMarkdownFiles && (!existingAnswer.files || !existingAnswer.files.md || !fs.existsSync(path.join(process.cwd(), existingAnswer.files.md)))) {
          needsUpdate = true;
        }
      }
    } else {
      needsUpdate = true;
    }

    if (needsUpdate) {
      if (!rawHtml) {
        // Crawl the Quora page to get the content
        const answerPage = await context.newPage();
        await answerPage.goto(result.url, { waitUntil: 'networkidle' });

        try {
          const contentHandles = await answerPage.$$('span.qu-userSelect--text');
          if (contentHandles.length > 1) {
            const contentHandle = contentHandles[1];
            const childElements = await contentHandle.evaluate(node => node.children.length);
            if (childElements > 0) {
              rawHtml = await contentHandle.innerHTML();
              const sanitizedFilename = sanitizeFilename(result.question) + '.html';
              const rawFilePath = path.join(rawContentDir, sanitizedFilename);
              fs.writeFileSync(rawFilePath, rawHtml);

              if (fs.existsSync(rawFilePath)) {
                result.files = {
                  raw_html: path.relative(process.cwd(), rawFilePath),
                };
                totalWriteCounts.raw_html++;
              } else {
                console.log(`Failed to save raw HTML for: ${result.question}`);
                totalFailureCounts.raw_html++;
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

      if (rawHtml) {
        const cleanedHtml = await cleanHtml(rawHtml, result.question, template, config.htmlWidth);
        const { filePaths, writeCounts, failureCounts } = await writeContent(result.question, cleanedHtml, config, usernameDir);

        result.files = { ...result.files, ...filePaths };
        totalWriteCounts.html += writeCounts.html;
        totalWriteCounts.md += writeCounts.md;
        totalFailureCounts.html += failureCounts.html;
        totalFailureCounts.md += failureCounts.md;

        if (consoleOutput) {
          console.log(`Saved content for: ${result.question} from raw HTML to ${filePaths.html ? filePaths.html : ''}${filePaths.md ? ' and ' + filePaths.md : ''}`);
        }
      }
    }
  }

  return { results, totalWriteCounts, totalFailureCounts }; // Return results with the file paths included
};

module.exports = { saveAnswerContent, writeContent };
