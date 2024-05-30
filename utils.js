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

const parseDate = (dateText) => {
  const now = new Date();
  let date;

  // Remove the 'Updated ' prefix if present
  dateText = dateText.replace(/^Updated\s+/i, '');

  try {
    if (dateText.match(/^[A-Za-z]{3} \d{1,2}$/)) {
      // Handle formats like 'May 24'
      date = new Date(Date.UTC(now.getUTCFullYear(), new Date(dateText + ' 01').getUTCMonth(), parseInt(dateText.split(' ')[1])));
      if (date > now) {
        date.setUTCFullYear(now.getUTCFullYear() - 1);
      }
    } else if (['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].some(day => dateText.includes(day))) {
      // Handle day of the week
      const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const todayIndex = now.getUTCDay();
      const dayIndex = daysOfWeek.findIndex(day => dateText.includes(day));
      let daysAgo = todayIndex - dayIndex;
      if (daysAgo <= 0) daysAgo += 7;
      date = new Date(now);
      date.setUTCDate(now.getUTCDate() - daysAgo);
    } else if (dateText.includes('Today')) {
      date = now;
    } else if (dateText.includes('Yesterday')) {
      date = new Date(now);
      date.setUTCDate(now.getUTCDate() - 1);
    } else if (dateText.includes('mo')) {
      const monthsAgo = parseInt(dateText, 10);
      date = new Date(now);
      date.setUTCMonth(now.getUTCMonth() - monthsAgo);
    } else if (dateText.includes('y')) {
      const yearsAgo = parseInt(dateText, 10);
      date = new Date(now);
      date.setUTCFullYear(now.getUTCFullYear() - yearsAgo);
    } else if (dateText.includes('d')) {
      const daysAgo = parseInt(dateText, 10);
      date = new Date(now);
      date.setUTCDate(now.getUTCDate() - daysAgo);
    } else if (dateText.includes('h')) {
      const hoursAgo = parseInt(dateText, 10);
      date = new Date(now);
      date.setUTCHours(now.getUTCHours() - hoursAgo);
    } else if (dateText.includes('m')) {
      const minutesAgo = parseInt(dateText, 10);
      date = new Date(now);
      date.setUTCMinutes(now.getUTCMinutes() - minutesAgo);
    } else {
      date = new Date(dateText);
    }

    if (isNaN(date.getTime())) {
      throw new Error('Invalid date');
    }

    return date.toISOString();
  } catch (error) {
    return '';
  }
};

module.exports = { formatUsername, sanitizeFilename, cleanHtml, convertHtmlToMarkdown, parseDate };
