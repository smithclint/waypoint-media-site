# Commercial Portfolio Configuration

The `commercial.json` file allows you to customize how your commercial videos are displayed in the portfolio.

## Structure

```json
{
  "release-tag-name": {
    "title": "Project Display Title",
    "description": "Project description shown in modal",
    "category": "retail|hospitality|corporate|marketing",
    "videos": {
      "video-filename.mp4": {
        "title": "Custom Video Title",
        "description": "Video description (optional)"
      }
    }
  }
}
```

## Example Configuration

```json
{
  "commercial-furniture-store": {
    "title": "Local Furniture Store",
    "description": "Marketing video showcasing the store's atmosphere and products",
    "category": "retail",
    "videos": {
      "store-walkthrough.mp4": {
        "title": "Store Tour",
        "description": "Complete walkthrough of the showroom"
      },
      "product-highlights.mp4": {
        "title": "Product Showcase",
        "description": "Featured furniture pieces and displays"
      }
    }
  }
}
```

## Adding New Projects

1. **Publish your videos** using the Makefile:

   ```bash
   make publish FILES=video_folder/ TYPE=commercial TITLE='My Business'
   ```

2. **Add configuration** to `commercial.json`:
   - Use the GitHub release tag name as the key
   - Add custom titles and descriptions for each video
   - Set appropriate category

3. **Deploy changes**:
   ```bash
   make deploy
   ```

## Categories

- **retail**: Stores, shops, retail businesses
- **hospitality**: Hotels, restaurants, entertainment venues
- **corporate**: Office spaces, professional services
- **marketing**: Brand videos, promotional content
- **general**: Other commercial work

## Benefits

- **Professional naming**: Replace technical filenames with marketing-friendly titles
- **Rich descriptions**: Add context and details for each video
- **Organized categories**: Better portfolio organization
- **Consistent branding**: Maintain professional presentation across all projects

## Fallback Behavior

If no configuration is found for a project:

- Uses GitHub release name or formatted tag name
- Shows formatted filename for individual videos
- Uses default descriptions from GitHub release
