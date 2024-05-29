# Quora Backup Script

* **[License](./LICENSE.txt):** MIT
* **[Version](./RELEASES.md):** 0.2
* **Usage:** quorabak "quora user name"

## Table of Contents
- [Quora Backup Script](#quora-backup-script)
  - [Table of Contents](#table-of-contents)
  - [Purpose](#purpose)
  - [Quick Approach](#quick-approach)
  - [Quick Update](#quick-update)
    - [Using a `.env` File](#using-a-env-file)
  - [Uninstall npm package](#uninstall-npm-package)
      - [Install `nvm` (Node Version Manager)](#install-nvm-node-version-manager)
      - [Install Node.js using `nvm`](#install-nodejs-using-nvm)
    - [Other Dependencies](#other-dependencies)
  - [Installation](#installation)
    - [npm install from github](#npm-install-from-github)
    - [Clone method](#clone-method)
      - [Setting Up as a Command](#setting-up-as-a-command)
  - [Usage](#usage)
    - [Running the Script](#running-the-script)
    - [Environment Variables](#environment-variables)
  - [Notes](#notes)

## Purpose

This script is designed to back up a user's Quora answers without requiring logging into Quora. It scrapes the public profile of a specified user and saves their answers in HTML and Markdown formats.

It keeps a note of all the questions it has already scraped so that it doesn't try to get them again. It will do a certain number at a time to prevent it looking like a bot, and to reduce the amount of resource it takes running the script.

## Quick Approach

There are a number of pre-requisites (see below) you may need to install depending on how you have things set up.

If you download the `install_dependencies.zsh` script this will install the required dependencies for you (in an opinionated way) and it will prompt you on where to install the Quora Backup script as a command called 'quorabak' (press y to confirm you want to install as a command).

```sh
curl -O https://raw.githubusercontent.com/storizzi/quora-backup/master/install_dependencies.zsh && chmod +x ./install_dependencies.zsh && ./install_dependencies.zsh --y
```

Then go to whichever directory you want to download the files to and run the quorabak command with your Quora User Name - e.g.:

```sh
cd ~/Downloads
quorabak "<Ursula Username>"
```

This downloads 10 documents at a time by default.

If you set up an .env file in this directory, you can adjust settings as described further down this document (e.g. if you want to do more documents at a time)

## Quick Update

If you want to get the latest version of the script after installing it, just use this command:

```sh
npm update quorabak
```

### Using a `.env` File

Create a `.env` file in the project directory to set environment variables through a file - e.g.

```plaintext
QUORA_USERNAME=your-quora-username
NUM_ITEMS=10
MAX_RETRIES=20
SCROLL_TIMEOUT_MS=1000
ANSWER_CLICK_MS=300
CONSOLE_OUTPUT=true
DEBUG_HTML=false
INCLUDE_ANSWER_TEXT=true
HTML_TEMPLATE_FILENAME=template.html
OUTPUT_HTML_FILES=true
OUTPUT_MARKDOWN_FILES=true
HTML_WIDTH=80
DEBUG_ENV_VARS=false
RETRY_FAILED_CONTENT: true
```

Check out the [Environment Variables](#environment-variables) section for an explanation of all the available configuration options.

Note - you do not have to include all of these - e.g. if you just wanted to include your user so you only have to type `quorabak` without a user name and you don't want markdown files, only HTML files, and you wanted to scrape 50 items at a time, then you could put the in your .env file

```plaintext
QUORA_USERNAME=Ursula Userton
NUM_ITEMS=50
OUTPUT_MARKDOWN_FILES=no
```

Note this file doesn't appear in Finder (things starting with dot are hidden by default). Open the directory in Terminal, and edit it using your favourite editor - or you can use the inbuilt mac text-edit textEdit using:

```sh
open -a TextEdit .env 
```

## Uninstall npm package

If you want to uninstall the npm package so the quorabak command goes away, use this command:

```sh
npm uninstall -g quora-backup

## Prerequisites

### Node.js and npm

Ensure you have Node.js and npm installed. We recommend using `nvm` to manage Node.js versions. Make sure you uninstall the homebrew version first if you were previously using this for node.js

```sh
brew uninstall node
```

#### Install `nvm` (Node Version Manager)

This uses homebrew (see below if you don't have homebrew already - or use an alternative method if you prefer not to use homebrew)

```sh
brew install nvm
```

Add the following lines to your `~/.zshrc` or (very old OSX) `~/.bash_profile`:

```sh
export NVM_DIR="$HOME/.nvm"
[ -s "/usr/local/opt/nvm/nvm.sh" ] && . "/usr/local/opt/nvm/nvm.sh"
```

Reload your shell configuration either by opening an new terminal / tab, or by typing the following command:

```sh
source ~/.zshrc
# or if you have an old version of OSX
source ~/.bash_profile
```

#### Install Node.js using `nvm`

```sh
nvm install node --lts
nvm use node --lts
```

### Other Dependencies

Install Homebrew if you haven't already:

```sh
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

Use Homebrew to install additional dependencies:

```sh
brew install playwright
# or
npm install -g playwright
```

Then install a copy of chromium (and other browsers just in case you want to use it for testing) for use by playwright:

```sh
npx playwright install
```

Playwright is used to run a copy of chromium (an invisible 'headless' browser) to navigate Quora. This can be used for a variety of web scraping and testing activities, so once you have it installed, you can experiment with other uses for playwright.

## Installation

### npm install from github

You can install the library globally as a command from github using this command:

```sh
npm install -g git+https://github.com/storizzi/quora-backup.git
```

### Clone method

If you want to play with code then you might want to install this using git clone.

Clone the repository and navigate to the project directory:

```sh
git clone https://github.com/storizzi/quora-backup.git
cd quora-backup
```

Install the required npm packages:

```sh
npm install
```

#### Setting Up as a Command

If you used the clone method of installation, to set up the script so it can be run as a system-wide command (`quorabak`), follow these steps:

1. Link the package globally:

    ```sh
    npm link
    ```

Now you can run the command `quorabak` from any directory.

## Usage

### Running the Script

You can run the script using command line parameters without setting anything else up. For example:

```sh
quorabak "<Quora Username>"
```
where `<Quora Username>` is typically your name - e.g. 'Ursula Userton'

Running the command will create a directory (e.g. 'Ursula-Userton') and inside this, generate a file `answers.json` which contains a list of the answers with their original URLs together with which content files have been written out. It also creates further sub-directories 'raw-html' for the unfiltered answer HTML, 'html' for cleaned-up html, and markdown in the 'md' directory (which is generated from the cleaned-up html).

To remove the content directories and JSON file:

```sh
quorabak clean "<Quora Username>"
```
or just delete the directory corresponding to the username.

### Environment Variables

The script supports several environment variables, which can be set in a `.env` file in the project directory (one level above the user-name directory).

There is a sample '.env-example' in the source folder that can be copied to '.env' as a template.

The variables and their descriptions are as follows:

- `QUORA_USERNAME`: The Quora username whose answers you want to back up. This can also be passed as a command line parameter.
- `NUM_ITEMS`: The number of items to back up. Default is 10.
- `INCLUDE_ANSWER_TEXT`: Set to `true`, `yes`, `1`, or `on` to include the answer text in the backup. This is on by default. Turn it off if you just want a list of locations for your answers in the answers.json file.
- `OUTPUT_MARKDOWN_FILES`: Set to `true`, `yes`, `1`, or `on` to output Markdown files. This is on by default.
- `OUTPUT_HTML_FILES`: Set to `true`, `yes`, `1`, or `on` to output cleaned HTML files. This is on by default.
- `HTML_WIDTH`: The maximum width for HTML lines. Default is 80 characters.
DEBUG_ENV_VARS=false
- `OUTPUT_MARKDOWN_FILES`: Set to `true`, `yes`, `1`, or `on` to output Markdown files. This is on by default.
- `RETRY_FAILED_CONTENT`: Set to `true`, `yes`, `1`, or `on` if you want to retry downloading content pages if it did not work before. This also works if you previously excluded a content type (e.g. md) and now want to include it. This is on by default.
- `MAX_RETRIES`: The maximum number of retries for scraping. Default is 20.
- `SCROLL_TIMEOUT_MS`: The timeout for scrolling the page. Default is 1000 ms.
- `ANSWER_CLICK_MS`: The delay after clicking an answer. Default is 300 ms.
- `HTML_TEMPLATE_FILENAME`: The HTML template filename. Default is `template.html` in the script directory. The template should contain `{{title}}` for where the question title should appear and `{{content}}` for where the answer should appear. The default file is in the source code directory.
- `CONSOLE_OUTPUT`: Set to `true`, `yes`, `1`, or `on` to enable console output of data for debugging purposes. Default is false.
- `DEBUG_HTML`: Set to `true`, `yes`, `1`, or `on` to enable HTML debugging output. Default is false.
- `DEBUG_ENV_VARS`: Set to `true`, `yes`, `1`, or `on` to debug where environment variables are being set from and how they are being overriden. Default is false.

## Notes

- This script is designed for backing up answers for a user without requiring logging into Quora. It is not intended for general scraping of Quora.
- It keeps a log of questions scraped already so that it doesn't try to get the answer again to save time.
- Make sure to comply with Quora's terms of service when using this script.
- There's a very good chance it will stop working, as it relies on a specific page structure being in place, and Quora does tend to change this quite regularly. Let me know if it stops working, and I'll endeavour to get it working again.
- You'll probably see several pages that don't save correctly. Let me know where this happens (it will probably give you a URL of the location it tried to read) and I'll see if I can add something to deal with edge cases. The good news is that if I do update the script and you re-run it, then it should just try to get the failed ones again automatically using the fix.
- I will try to improve the script to extract further information in future versions, and improve formatting. I've tried to improve the main output HTML over the raw HTML, but I'm sure it can be improved upon. I have tried to reduce the redundant spans, and removed the excessive formatting in the raw html, to get bold and italics as the only formatting - as this is the main thing that's useful for converting to Markdown.
- I've only tested this on OSX (a Mac). Let me know if you have issues on Linux / WSL on a PC.
