#!/bin/zsh

# Function to check and install Homebrew
check_and_install_brew() {
  if ! command -v brew &> /dev/null; then
    echo "Homebrew not found. Installing Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    if [ $? -ne 0 ]; then
      echo "Failed to install Homebrew. Aborting."
      exit 1
    fi
  else
    echo "Homebrew is already installed."
  fi
}

# Function to uninstall Node.js if installed via Homebrew
uninstall_homebrew_node() {
  if brew list node &> /dev/null; then
    echo "Node.js installed via Homebrew. Uninstalling..."
    brew uninstall node
    if [ $? -ne 0 ]; then
      echo "Failed to uninstall Node.js installed via Homebrew. Aborting."
      exit 1
    fi
  else
    echo "Node.js is not installed via Homebrew."
  fi
}

# Function to ensure nvm is sourced correctly
source_nvm() {
  export NVM_DIR="$HOME/.nvm"
  if [ -s "$NVM_DIR/nvm.sh" ]; then
    . "$NVM_DIR/nvm.sh"
  elif [ -s "/usr/local/opt/nvm/nvm.sh" ]; then
    . "/usr/local/opt/nvm/nvm.sh"
  else
    echo "nvm not found. Please install nvm and try again."
    exit 1
  fi
}

# Function to check and install nvm
check_and_install_nvm() {
  source_nvm

  if ! command -v nvm &> /dev/null; then
    echo "nvm not found. Installing nvm..."
    brew install nvm
    if [ $? -ne 0 ]; then
      echo "Failed to install nvm. Aborting."
      exit 1
    fi
  else
    echo "nvm is already installed."
  fi

  # Add nvm to .zshrc if not already added
  if ! grep -q 'export NVM_DIR="$HOME/.nvm"' ~/.zshrc; then
    echo 'export NVM_DIR="$HOME/.nvm"' >> ~/.zshrc
    echo '[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"' >> ~/.zshrc
    echo "nvm added to .zshrc. Please restart your terminal or run 'source ~/.zshrc'."
  fi

  source_nvm
}

# Function to check and install Node.js LTS using nvm
check_and_install_node() {
  source_nvm

  if ! command -v node &> /dev/null; then
    echo "Node.js not found. Installing Node.js LTS..."
    nvm install --lts
    nvm alias default lts/*
    if [ $? -ne 0 ]; then
      echo "Failed to install Node.js. Aborting."
      exit 1
    fi
  else
    echo "Node.js is already installed."
  fi
}

# Function to check and install Playwright
check_and_install_playwright() {
  if ! npm list -g playwright &> /dev/null; then
    echo "Playwright not found. Installing Playwright..."
    npm install -g playwright
    if [ $? -ne 0 ]; then
      echo "Failed to install Playwright. Aborting."
      exit 1
    fi
  else
    echo "Playwright is already installed."
  fi
}

# Function to install Playwright browsers
install_playwright_browsers() {
  echo "Installing Playwright browsers..."
  npx playwright install
  if [ $? -ne 0 ]; then
    echo "Failed to install Playwright browsers. Aborting."
    exit 1
  fi
}

# Function to check if Quora Backup is installed
check_quorabak_installed() {
  if ! command -v quorabak &> /dev/null; then
    echo "Quorabak is not installed."
    echo "Would you like to install Quora Backup from GitHub? (y/n) \c"
    read choice
    case "$choice" in 
      y|Y ) 
        echo "Installing Quora Backup from GitHub..."
        npm install -g git+https://github.com/storizzi/quora-backup.git
        if [ $? -ne 0 ]; then
          echo "Failed to install Quora Backup from GitHub. Aborting."
          exit 1
        fi
        ;;
      * ) 
        echo "Aborting."
        exit 1
        ;;
    esac
  else
    echo "Quorabak is already installed."
  fi
}

# Main script execution
echo "Checking and installing dependencies..."

check_and_install_brew
uninstall_homebrew_node
check_and_install_nvm
check_and_install_node
check_and_install_playwright
install_playwright_browsers

# Check if Quora Backup is installed
check_quorabak_installed

echo "All dependencies are installed successfully."
