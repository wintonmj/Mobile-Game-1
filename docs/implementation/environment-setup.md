# Developer Environment Setup Guide

## Overview
This guide provides detailed instructions for setting up the development environment for the Phaser RPG project. Following these steps will ensure you have all the necessary tools and configurations to start development quickly and efficiently.

## System Requirements

### Hardware Requirements
- **Memory**: 8GB RAM recommended (4GB minimum)
- **Disk Space**: At least 2GB of free disk space
- **Display**: 1280x720 minimum resolution

### Software Requirements
- **Operating System**: Windows 10/11, macOS 10.15+, or Linux
- **Browser**: Chrome 90+, Firefox 90+, or Edge 90+ (latest versions recommended)
- **Development Tools**: Git 2.x+, Node.js 18.0+ LTS or 20.0+ LTS

## Installation Steps

### 1. Core Development Tools

#### Node.js and npm
1. Download Node.js (v18.0+ LTS or v20.0+ LTS) from [Node.js Official Website](https://nodejs.org/)
2. Install Node.js, which includes npm (v8.0+)
3. Verify installation:
   ```bash
   node --version   # Should return v18.x.x or v20.x.x
   npm --version    # Should return 8.x.x or higher
   ```

#### Git
1. Download Git from [Git Official Website](https://git-scm.com/downloads)
2. Install Git with default options
3. Verify installation:
   ```bash
   git --version    # Should return 2.x.x or higher
   ```

#### Global Dependencies
Install required global packages:
```bash
# Core development tools
npm install -g typescript@5.0.0
npm install -g vite@4.0.0

# Asset processing tools
npm install -g texture-packer
npm install -g imagemin-cli

# Development utilities
npm install -g concurrently
npm install -g cross-env
```

### 2. IDE Setup

#### Cursor (Recommended)
1. Download and install Cursor from [Cursor Official Website](https://cursor.sh/)
2. Install required extensions:
   - ESLint
   - Prettier
   - Git Integration
   - Phaser.js snippets (if available)
3. Configure workspace settings:
   ```json
   {
     "editor.formatOnSave": true,
     "editor.defaultFormatter": "esbenp.prettier-vscode",
     "editor.codeActionsOnSave": {
       "source.fixAll.eslint": true
     }
   }
   ```

#### VSCode Alternative
1. Download and install VSCode
2. Install required extensions:
   - ESLint
   - Prettier
   - Git Lens
   - TypeScript support
3. Use the same workspace settings as Cursor

### 3. Project Setup

#### Clone and Initialize
```bash
# Clone the project repository
git clone [REPOSITORY_URL]
cd [PROJECT_DIRECTORY]

# Install project dependencies
npm install
```

#### Configure TypeScript
The project includes a preconfigured `tsconfig.json`. Key settings:
```json
{
  "compilerOptions": {
    "strict": true,
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

#### Configure ESLint and Prettier
1. ESLint configuration is provided in `.eslintrc.js`
2. Prettier configuration in `.prettierrc`:
   ```json
   {
     "semi": true,
     "trailingComma": "es5",
     "singleQuote": true,
     "printWidth": 100,
     "tabWidth": 2,
     "endOfLine": "auto"
   }
   ```

### 4. Git Configuration

#### Git Hooks Setup
1. Install husky for Git hooks:
   ```bash
   npx husky install
   ```

2. Configure pre-commit hook for linting and formatting:
   ```bash
   npx husky add .husky/pre-commit "npm run lint && npm run format"
   ```

3. Configure pre-push hook for testing:
   ```bash
   npx husky add .husky/pre-push "npm run test"
   ```

#### Git Configuration
```bash
# Configure Git user information
git config user.name "Your Name"
git config user.email "your.email@example.com"

# Configure line endings
git config core.autocrlf input  # For macOS/Linux
git config core.autocrlf true   # For Windows
```

## Verification Steps

### 1. Development Server
```bash
# Start the development server
npm run dev

# Access the game at http://localhost:5173
```

### 2. Test Environment
```bash
# Run the test suite
npm run test

# Check test coverage
npm run test:coverage
```

### 3. Build Process
```bash
# Create production build
npm run build

# Preview production build
npm run preview
```

## Troubleshooting

### Node.js Issues
1. **Version Conflicts**
   ```bash
   # Install nvm (Node Version Manager)
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash
   
   # Install and use correct Node.js version
   nvm install 18
   nvm use 18
   ```

2. **Package Installation Errors**
   ```bash
   # Clear npm cache
   npm cache clean --force
   
   # Reinstall dependencies
   rm -rf node_modules package-lock.json
   npm install
   ```

### TypeScript Issues
1. **Compilation Errors**
   ```bash
   # Verify TypeScript installation
   npx tsc --version
   
   # Reinstall TypeScript if needed
   npm install typescript@5.0.0 --save-dev
   ```

2. **Type Definition Issues**
   ```bash
   # Install Phaser type definitions
   npm install @types/phaser --save-dev
   ```

### Development Server Issues
1. **Port Conflicts**
   ```bash
   # Try alternative port
   npm run dev -- --port 3000
   ```

2. **Hot Reload Issues**
   - Clear browser cache
   - Restart development server
   - Check for file watching limits on Linux:
     ```bash
     echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
     sudo sysctl -p
     ```

### Phaser.js Issues
1. **Loading Problems**
   ```bash
   # Reinstall Phaser
   npm install phaser@3.60.0 --save
   ```

2. **Asset Loading Issues**
   - Verify assets are in the correct directory
   - Check asset path in code
   - Ensure Vite is configured to handle asset types

## Additional Resources

- [Phaser.js Documentation](https://phaser.io/documentation/3.60.0)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Vite Documentation](https://vitejs.dev/guide/)
- [Project Documentation](../README.md)
- [Development Workflow Guide](./development-workflow.md)
- [Testing Strategy Guide](../testing/jest-testing-strategy.md)

## Support

If you encounter any issues not covered in this guide:
1. Check the project's issue tracker
2. Consult the project maintainers
3. Create a new issue with detailed reproduction steps 