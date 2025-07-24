# GitHub Pages Deployment

This repository is configured to automatically deploy to GitHub Pages using GitHub Actions.

## Automatic Deployment

- **Trigger**: Every push to the `main` branch
- **Workflow**: `.github/workflows/pages.yml`
- **URL**: The site will be available at your configured domain

## Manual Deployment

You can also trigger a deployment manually:

1. Go to the GitHub repository
2. Click on the "Actions" tab
3. Select "Deploy to GitHub Pages"
4. Click "Run workflow"

## Configuration Steps

### 1. Enable GitHub Pages (One-time setup)

In your GitHub repository:

1. Go to **Settings** → **Pages**
2. Under **Source**, select **GitHub Actions**
3. The workflow will automatically deploy your site

### 2. Custom Domain Setup (Optional)

Since you have a `CNAME` file with `waypointmediapro.com`:

1. In **Settings** → **Pages**
2. Under **Custom domain**, enter: `waypointmediapro.com`
3. Check **Enforce HTTPS**

### 3. DNS Configuration

Point your domain to GitHub Pages:

```
# For apex domain (waypointmediapro.com)
A     185.199.108.153
A     185.199.109.153
A     185.199.110.153
A     185.199.111.153

# For www subdomain (optional)
CNAME www.waypointmediapro.com smithclint.github.io
```

## File Structure

The deployment includes:

- `index.html` - Main landing page
- `gallery.html` - Portfolio gallery
- `resume.html` - Resume/background page
- `drone.html` - Legacy drone page
- `styles.css` - Stylesheet
- `assets/` - Images and media files
- `CNAME` - Custom domain configuration
- `.nojekyll` - Disables Jekyll processing

## Deployment Status

Check deployment status:

- **GitHub Actions**: Repository → Actions tab
- **Live Site**: https://waypointmediapro.com (once DNS configured)
- **GitHub URL**: https://smithclint.github.io/waypoint-media-site

## Troubleshooting

### Site not updating

- Check the Actions tab for failed deployments
- Ensure all commits are pushed to `main` branch
- Wait a few minutes for propagation

### Custom domain issues

- Verify DNS settings with your domain provider
- Check that HTTPS is enforced in Pages settings
- Confirm CNAME file contains correct domain

### 404 errors

- Ensure `index.html` exists in root directory
- Check file paths are relative (not absolute)
- Verify all linked files exist in repository
