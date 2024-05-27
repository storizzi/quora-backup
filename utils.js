const { JSDOM } = require('jsdom');
const { minify } = require('html-minifier-terser');
const pretty = require('pretty');
const TurndownService = require('turndown');

const formatUsername = (username) => {
  return username.split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('-');
};

const sanitizeFilename = (title) => {
  return title.replace(/[^a-zA-Z0-9]/g, '-').replace(/-+/g, '-');
};

const replaceSpanWithFormatting = (document) => {
  const spans = document.querySelectorAll('span[style]');
  spans.forEach(span => {
    const style = span.getAttribute('style');
    let newElement = span.cloneNode(true);

    if (style.includes('font-style: italic') && style.includes('font-weight: bold')) {
      const em = document.createElement('em');
      const b = document.createElement('b');
      em.innerHTML = span.innerHTML;
      b.appendChild(em);
      newElement = b;
    } else if (style.includes('font-style: italic')) {
      const em = document.createElement('em');
      em.innerHTML = span.innerHTML;
      newElement = em;
    } else if (style.includes('font-weight: bold')) {
      const b = document.createElement('b');
      b.innerHTML = span.innerHTML;
      newElement = b;
    }

    span.parentNode.replaceChild(newElement, span);
  });

  // Remove unnecessary spans
  const allSpans = document.querySelectorAll('span');
  allSpans.forEach(span => {
    if (span.childElementCount === 0) { // Only plain text inside
      span.replaceWith(span.textContent);
    }
  });
};

const wrapText = (text, width) => {
  const words = text.split(' ');
  let currentLine = '';
  let result = '';

  words.forEach(word => {
    if (currentLine.length + word.length + 1 > width) {
      result += `${currentLine.trim()}\n`;
      currentLine = word + ' ';
    } else {
      currentLine += word + ' ';
    }
  });

  if (currentLine.trim().length > 0) {
    result += currentLine.trim();
  }

  return result;
};

const wrapHtmlContent = (document, width) => {
  const elements = document.querySelectorAll('body *');
  elements.forEach(element => {
    if (element.childElementCount === 0 && element.textContent.length > width) {
      element.textContent = wrapText(element.textContent, width);
    }
  });
};

const cleanHtml = async (htmlContent, title, template, width) => {
  const dom = new JSDOM(htmlContent);
  const document = dom.window.document;

  replaceSpanWithFormatting(document);
  wrapHtmlContent(document, width);

  const elements = document.querySelectorAll('*');
  elements.forEach(element => {
    element.removeAttribute('class');
    element.removeAttribute('style');
  });

  let cleanedHtml = template.replace('{{content}}', `<h1>${title}</h1>${document.body.innerHTML}`).replace('{{title}}', title);

  cleanedHtml = await minify(cleanedHtml, {
    collapseWhitespace: false,
    removeComments: true,
    removeEmptyAttributes: true,
    minifyCSS: true,
    minifyJS: true,
    keepClosingSlash: true,
    caseSensitive: true,
    sortAttributes: true,
    sortClassName: true,
    useShortDoctype: true,
    removeEmptyElements: false
  });

  return pretty(cleanedHtml);
};

const convertHtmlToMarkdown = (htmlContent) => {
  const turndownService = new TurndownService();
  let markdownContent = turndownService.turndown(htmlContent);

  // Remove the first two lines which contain the duplicate title
  const lines = markdownContent.split('\n');
  if (lines.length > 2) {
    lines.splice(0, 2);
  }

  // Keep the title as an H1 header at the top - rejoin the lines
  markdownContent = lines.join('\n').trim();

  return markdownContent;
};

module.exports = { formatUsername, sanitizeFilename, cleanHtml, convertHtmlToMarkdown };
