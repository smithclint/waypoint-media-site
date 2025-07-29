# Simple GitHub Pages Setup Instructions

This uses the simple branch deployment method, just like your resume site.

## Step 1: Enable GitHub Pages

1. Go to your repository: https://github.com/smithclint/waypoint-media-site
2. Click on **Settings** (tab at the top)
3. Scroll down to **Pages** in the left sidebar
4. Under **Source**, select **Deploy from a branch**
5. Choose **main** branch and **/ (root)** folder
6. Click **Save**

## Step 2: Verify Deployment

1. The site will build automatically from the main branch
2. GitHub will show a green checkmark and deployment URL
3. No Actions workflow needed - it's automatic!

## Step 3: Access Your Site

Your site will be available at:

- **GitHub URL**: https://smithclint.github.io/waypoint-media-site
- **Custom Domain**: https://waypointmediapro.com (after DNS setup)

## Step 4: Configure Custom Domain (Optional)

If you want to use `waypointmediapro.com`:

### In GitHub:

1. Go to **Settings** → **Pages**
2. Under **Custom domain**, enter: `waypointmediapro.com`
3. Check **Enforce HTTPS**
4. Save

### DNS Configuration:

Set up these DNS records with your domain provider:

```
Type: A
Name: @
Value: 185.199.108.153

Type: A
Name: @
Value: 185.199.109.153

Type: A
Name: @
Value: 185.199.110.153

Type: A
Name: @
Value: 185.199.111.153
```

For www subdomain (optional):

```
Type: CNAME
Name: www
Value: smithclint.github.io
```

## Step 5: Wait for Propagation

- GitHub Pages: Usually live within a few minutes
- DNS changes: Can take up to 24-48 hours to propagate globally

## Troubleshooting

### If the deployment fails:

1. Check the repository is public (or you have GitHub Pro for private repos)
2. Verify the main branch has your HTML files
3. Make sure there are no syntax errors in your HTML

### If the site doesn't deploy:

1. Check that Pages is enabled in Settings → Pages
2. Verify **Deploy from a branch** is selected
3. Ensure **main** branch and **/ (root)** folder are chosen
4. Make sure the repository is public
5. Verify index.html exists in the repository root

### Custom domain issues:

1. Verify DNS settings with your provider
2. Use online DNS checkers to verify propagation
3. Make sure HTTPS is enforced in Pages settings

## Current Repository Status

✅ Simple branch deployment configured
✅ .nojekyll file added (disables Jekyll)
✅ CNAME file present with your domain
✅ All HTML files formatted and validated
✅ Repository structure ready for deployment

The site will automatically deploy whenever you push to the main branch - no GitHub Actions needed!
