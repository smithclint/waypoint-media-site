# Reviews System Documentation

## Overview

The reviews system dynamically loads and displays client testimonials on the Real Estate and Commercial portfolio pages. Reviews are stored in JSON files and the system automatically shows/hides the reviews section based on content availability.

## File Structure

```
reviews/
├── README.md              # This documentation
├── real-estate.json       # Reviews for real estate page
├── commercial.json        # Reviews for commercial page
└── empty-test.json        # Test file for empty reviews (optional)
```

## How It Works

- JavaScript automatically detects which page is being viewed
- Loads the appropriate JSON file (`real-estate.json` or `commercial.json`)
- If no reviews exist or file is missing, the entire reviews section is hidden
- If reviews exist, they are dynamically rendered with star ratings and verification badges

## JSON File Format

Each JSON file should follow this structure:

```json
{
  "reviews": [
    {
      "id": "unique-identifier",
      "author": "Full Name",
      "company": "Company or Organization Name",
      "rating": 5,
      "text": "The review text content goes here...",
      "date": "YYYY-MM-DD",
      "verified": true
    }
  ]
}
```

### Field Descriptions

- **id**: Unique identifier for the review (e.g., "re-001", "com-001")
- **author**: Full name of the person giving the review
- **company**: Company, organization, or title of the reviewer
- **rating**: Star rating from 1-5 (integer)
- **text**: The actual review content (enclose in quotes)
- **date**: Date in YYYY-MM-DD format
- **verified**: Boolean (true/false) - shows verification badge if true

## Adding New Reviews

### Step 1: Choose the Right File

- **Real Estate reviews**: Edit `real-estate.json`
- **Commercial reviews**: Edit `commercial.json`

### Step 2: Add Review Object

Add a new review object to the "reviews" array:

```json
{
  "reviews": [
    {
      "id": "re-004",
      "author": "New Client Name",
      "company": "Their Company",
      "rating": 5,
      "text": "Amazing work! The photos were perfect for our listing.",
      "date": "2025-07-29",
      "verified": true
    }
  ]
}
```

### Step 3: Important Notes

- Always use unique IDs (increment the number: re-001, re-002, etc.)
- Keep ratings between 1-5
- Escape quotes in review text with backslashes if needed: `"She said \"amazing\" work!"`
- Use current date format: YYYY-MM-DD
- Don't forget commas between review objects

## Removing Reviews

### Remove Specific Review

Delete the entire review object from the JSON array, including surrounding commas.

### Remove All Reviews (Hide Section)

Replace the entire file content with:

```json
{
  "reviews": []
}
```

Or delete the JSON file entirely - the section will automatically hide.

## Example: Adding a Commercial Review

Before:

```json
{
  "reviews": [
    {
      "id": "com-001",
      "author": "Sarah Johnson",
      "company": "BoxDrop Furniture Store",
      "rating": 5,
      "text": "Great work!",
      "date": "2025-01-20",
      "verified": true
    }
  ]
}
```

After adding new review:

```json
{
  "reviews": [
    {
      "id": "com-001",
      "author": "Sarah Johnson",
      "company": "BoxDrop Furniture Store",
      "rating": 5,
      "text": "Great work!",
      "date": "2025-01-20",
      "verified": true
    },
    {
      "id": "com-002",
      "author": "Mark Stevens",
      "company": "Local Restaurant",
      "rating": 4,
      "text": "Professional aerial footage helped showcase our outdoor seating area perfectly.",
      "date": "2025-07-29",
      "verified": false
    }
  ]
}
```

## Testing

### To Test Empty Reviews

1. Replace content of a JSON file with: `{"reviews": []}`
2. Reload the page - reviews section should disappear
3. Restore original content to bring reviews back

### To Test New Reviews

1. Add a new review object to the appropriate JSON file
2. Reload the page - new review should appear
3. Check that star ratings and verification badges display correctly

## Troubleshooting

### Reviews Not Showing

- Check JSON syntax is valid (use a JSON validator)
- Ensure commas are properly placed between objects
- Verify the file is in the correct `reviews/` folder
- Check browser console for JavaScript errors

### Section Not Hiding When Empty

- Ensure reviews array is empty: `"reviews": []`
- Check that JavaScript file (reviews.js) is loaded
- Verify browser console for errors

### Formatting Issues

- Use straight quotes (`"`) not curly quotes (`"`)
- Escape special characters in review text
- Ensure proper JSON structure with brackets and braces

## Quick Reference

### Common ID Patterns

- Real Estate: `re-001`, `re-002`, `re-003`, etc.
- Commercial: `com-001`, `com-002`, `com-003`, etc.

### Star Ratings Display

- 5 stars: ⭐⭐⭐⭐⭐ (all filled)
- 4 stars: ⭐⭐⭐⭐☆ (4 filled, 1 empty)
- 3 stars: ⭐⭐⭐☆☆ (3 filled, 2 empty)

### Verification Badge

- `"verified": true` → Shows green checkmark with "Verified"
- `"verified": false` → No badge shown

---

**Last Updated**: July 29, 2025
**System Version**: Dynamic Reviews v1.0
