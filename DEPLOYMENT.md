# Sudoku Angular - GitHub Pages Deployment

This project is configured for deployment to GitHub Pages.

## Deployment Methods

### Method 1: Automated Deployment (Recommended)

The project includes a GitHub Actions workflow that automatically deploys to GitHub Pages when you push to the `master` branch.

**Setup:**
1. Go to your repository on GitHub
2. Navigate to Settings → Pages
3. Under "Source", select "GitHub Actions"
4. Push your changes to the `master` branch
5. The workflow will automatically build and deploy your app

### Method 2: Manual Deployment

You can also deploy manually using the npm scripts:

```bash
# Install dependencies
npm install

# Build for GitHub Pages
npm run build:gh

# Deploy to GitHub Pages
npm run deploy:gh
```

## Configuration Details

### Angular Configuration
- **Base Href**: Set to `/sudoku-angular/` for GitHub Pages
- **Output Mode**: Changed to `static` for static site generation
- **Build Configuration**: Custom `github-pages` configuration added

### Routing
- **404.html**: Created to handle client-side routing on GitHub Pages
- **SPA Redirect**: Automatically redirects to the Angular app with proper routing

### GitHub Actions Workflow
- **Trigger**: Runs on push to `master` branch
- **Node Version**: Uses Node.js 20
- **Build Command**: `npm run build:gh`
- **Deploy**: Uses `peaceiris/actions-gh-pages` action

## URLs

After deployment, your app will be available at:
- **Main App**: `https://anna7461.github.io/sudoku-angular/`
- **Privacy Policy**: `https://anna7461.github.io/sudoku-angular/privacy-policy`

## Troubleshooting

### Common Issues:

1. **404 Errors on Refresh**: Make sure the `404.html` file is included in your build
2. **Assets Not Loading**: Verify the `baseHref` is set correctly in the build configuration
3. **Routing Issues**: Ensure the GitHub Actions workflow is properly configured

### Manual Fixes:

If you encounter issues, you can:
1. Check the GitHub Actions logs for build errors
2. Verify the `dist/sudoku-angular/browser` directory contains all necessary files
3. Ensure GitHub Pages is configured to use GitHub Actions as the source

## Development vs Production

- **Development**: Use `npm start` for local development
- **Production**: Use `npm run build:gh` for GitHub Pages deployment
- **Testing**: Use `npm run build` for standard production builds
