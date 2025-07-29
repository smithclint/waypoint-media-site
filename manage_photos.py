#!/usr/bin/env python3
"""
Real Estate Photo Management Script

This script helps manage real estate photos by:
1. Creating a photos.json configuration file
2. Organizing photos by shoot/project
3. Generating the photo data for the JavaScript file

Usage:
1. Place your photos in assets/real-estate/[shoot-name]/
2. Run this script to generate/update the photo configuration
3. The script will update real-estate.js with your photo data
"""

import argparse
import glob
import json
import os

# Configuration
PHOTOS_DIR = "assets/real-estate"
PHOTOS_CONFIG = "photos.json"
JS_FILE = "real-estate.js"


def scan_photos_directory():
    """Scan the photos directory and return organized photo data"""
    photo_data = {}

    if not os.path.exists(PHOTOS_DIR):
        print(f"Creating photos directory: {PHOTOS_DIR}")
        os.makedirs(PHOTOS_DIR, exist_ok=True)
        return photo_data

    # Scan for shoot directories
    for shoot_dir in glob.glob(f"{PHOTOS_DIR}/*/"):
        shoot_name = os.path.basename(shoot_dir.rstrip("/"))

        # Skip hidden directories
        if shoot_name.startswith("."):
            continue

        print(f"Found shoot directory: {shoot_name}")

        # Find images in the shoot directory
        image_extensions = ["*.jpg", "*.jpeg", "*.png", "*.webp"]
        images = []

        for ext in image_extensions:
            images.extend(glob.glob(f"{shoot_dir}/{ext}"))
            images.extend(glob.glob(f"{shoot_dir}/{ext.upper()}"))

        if images:
            shoot_title = shoot_name.replace("-", " ").replace("_", " ")
            photo_data[shoot_name] = {
                "title": shoot_title.title(),
                "description": f"Professional aerial photography of {shoot_title}",
                "category": "residential",  # Default category
                "images": [],
            }

            for img_path in sorted(images):
                img_name = os.path.basename(img_path)
                web_path = img_path.replace("\\", "/")  # Normalize path separators

                photo_data[shoot_name]["images"].append(
                    {
                        "url": web_path,
                        "caption": img_name.replace(".jpg", "")
                        .replace(".jpeg", "")
                        .replace(".png", "")
                        .replace("-", " ")
                        .replace("_", " ")
                        .title(),
                    }
                )

            print(f"  Found {len(images)} images")

    return photo_data


def load_existing_config():
    """Load existing photo configuration if it exists"""
    if os.path.exists(PHOTOS_CONFIG):
        try:
            with open(PHOTOS_CONFIG, "r") as f:
                return json.load(f)
        except json.JSONDecodeError:
            print(f"Warning: {PHOTOS_CONFIG} contains invalid JSON, starting fresh")
            return {}
    return {}


def save_config(photo_data):
    """Save photo configuration to JSON file"""
    with open(PHOTOS_CONFIG, "w") as f:
        json.dump(photo_data, f, indent=2)
    print(f"Saved configuration to {PHOTOS_CONFIG}")


def update_javascript_file(photo_data):
    """Update the JavaScript file with new photo data"""
    if not os.path.exists(JS_FILE):
        print(f"Warning: {JS_FILE} not found, skipping JavaScript update")
        return

    # Read the current JavaScript file
    with open(JS_FILE, "r") as f:
        js_content = f.read()

    # Find the portfolioData object and replace it
    start_marker = "const portfolioData = {"

    start_idx = js_content.find(start_marker)
    if start_idx == -1:
        print(f"Warning: Could not find portfolioData in {JS_FILE}")
        return

    # Find the end of the portfolioData object
    brace_count = 0
    end_idx = start_idx + len(start_marker) - 1  # Start from the opening brace

    for i, char in enumerate(
        js_content[start_idx + len(start_marker) - 1 :],
        start_idx + len(start_marker) - 1,
    ):
        if char == "{":
            brace_count += 1
        elif char == "}":
            brace_count -= 1
            if brace_count == 0:
                end_idx = i + 1
                break

    # Generate new JavaScript object
    js_object = "const portfolioData = " + json.dumps(photo_data, indent=2) + ";"

    # Replace the old object with the new one
    new_js_content = js_content[:start_idx] + js_object + js_content[end_idx:]

    # Write the updated file
    with open(JS_FILE, "w") as f:
        f.write(new_js_content)

    print(f"Updated {JS_FILE} with new photo data")


def create_sample_structure():
    """Create sample directory structure for demonstration"""
    sample_shoots = [
        "luxury-waterfront-estate",
        "modern-office-complex",
        "suburban-family-home",
        "beachfront-condominium",
    ]

    for shoot in sample_shoots:
        shoot_dir = f"{PHOTOS_DIR}/{shoot}"
        os.makedirs(shoot_dir, exist_ok=True)

        # Create a placeholder README
        readme_path = f"{shoot_dir}/README.md"
        if not os.path.exists(readme_path):
            with open(readme_path, "w") as f:
                f.write(f"# {shoot.replace('-', ' ').title()}\n\n")
                f.write("Place your photos for this shoot in this directory.\n")
                f.write("Supported formats: JPG, JPEG, PNG, WEBP\n")

    print(f"Created sample directory structure in {PHOTOS_DIR}")


def main():
    parser = argparse.ArgumentParser(description="Manage real estate photos")
    parser.add_argument(
        "--create-sample", action="store_true", help="Create sample directory structure"
    )
    parser.add_argument(
        "--scan-only",
        action="store_true",
        help="Only scan directories, don't update files",
    )

    args = parser.parse_args()

    if args.create_sample:
        create_sample_structure()
        return

    # Load existing configuration
    existing_config = load_existing_config()

    # Scan for new photos
    scanned_data = scan_photos_directory()

    # Merge with existing configuration (preserve manual edits)
    merged_data = existing_config.copy()

    for shoot_id, shoot_data in scanned_data.items():
        if shoot_id in merged_data:
            # Update images but preserve manually edited metadata
            merged_data[shoot_id]["images"] = shoot_data["images"]
            print(f"Updated images for existing shoot: {shoot_id}")
        else:
            merged_data[shoot_id] = shoot_data
            print(f"Added new shoot: {shoot_id}")

    # Save updated configuration
    if not args.scan_only:
        save_config(merged_data)
        update_javascript_file(merged_data)

    print("\nSummary:")
    print(f"Total shoots: {len(merged_data)}")
    for shoot_id, shoot_data in merged_data.items():
        print(f"  {shoot_id}: {len(shoot_data.get('images', []))} images")


if __name__ == "__main__":
    main()
