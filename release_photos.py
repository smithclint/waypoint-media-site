#!/usr/bin/env python3
"""
GitHub Release Photo Uploader Helper

This script helps you prepare photos for GitHub releases by:
1. Organizing photos by shoot
2. Generating the correct URLs for photos.json
3. Creating release tags and instructions

Usage: python3 release_photos.py --shoot sugar-mill-pool-home --photos path/to/photos/
"""

import argparse
import base64
import hashlib
import json
import os
import shutil
import subprocess
import tempfile
from pathlib import Path

# Import for AI classification
try:
    import openai
    from dotenv import load_dotenv

    load_dotenv()  # Load environment variables from .env file
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False
    print("⚠️  OpenAI not available. Install with: pip install openai python-dotenv")
    print("   AI classification will be skipped.")

try:
    from PIL import Image

    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False
    print("⚠️  PIL/Pillow not available. Install with: pip install Pillow")
    print("   Image downsampling will be skipped.")


def generate_unique_prefix(shoot_name, method="hash"):
    """Generate a unique prefix for photos based on shoot name"""
    if method == "hash":
        # Create a short hash from the shoot name
        shoot_hash = hashlib.md5(shoot_name.encode()).hexdigest()[:6]
        return f"{shoot_name[:8]}-{shoot_hash}"
    elif method == "simple":
        # Just use the shoot name with some cleanup
        clean_name = shoot_name.replace("_", "-").replace(" ", "-").lower()
        return clean_name[:12]  # Limit length
    else:
        # Sequential method - just use shoot name
        return shoot_name.replace("_", "-").replace(" ", "-").lower()


def generate_prefixed_filename(original_filename, prefix, counter=None, room_type=None):
    """Generate a new filename with unique prefix and optional room classification"""
    name, ext = os.path.splitext(original_filename)

    # Build filename components
    parts = [prefix]

    # Add room type if available
    if room_type:
        parts.append(room_type)

    # Add counter if specified
    if counter is not None:
        parts.append(f"{counter:03d}")

    # Add original name (cleaned up)
    clean_name = name.replace("-", "").replace("_", "")  # Remove existing separators
    if clean_name and not clean_name.isdigit():  # Only add if it's not just a number
        parts.append(clean_name)

    return f"{'-'.join(parts)}{ext}"


def downsample_image(
    input_path, output_path, max_width=1920, max_height=1080, quality=85
):
    """Downsample image for web optimization"""
    if not PIL_AVAILABLE:
        # If PIL not available, just copy the original
        shutil.copy2(input_path, output_path)
        return False

    try:
        with Image.open(input_path) as img:
            # Convert to RGB if necessary (handles RGBA, etc.)
            if img.mode in ("RGBA", "LA", "P"):
                img = img.convert("RGB")

            # Calculate new dimensions maintaining aspect ratio
            width, height = img.size
            if width <= max_width and height <= max_height:
                # Image is already small enough, but still optimize quality
                img.save(output_path, "JPEG", quality=quality, optimize=True)
                return True

            # Calculate resize ratio
            width_ratio = max_width / width
            height_ratio = max_height / height
            ratio = min(width_ratio, height_ratio)

            new_width = int(width * ratio)
            new_height = int(height * ratio)

            # Resize and save
            resized_img = img.resize((new_width, new_height), Image.LANCZOS)
            resized_img.save(output_path, "JPEG", quality=quality, optimize=True)

            return True
    except Exception as e:
        print(f"   ⚠️  Error downsampling {input_path}: {e}")
        # Fallback to copying original
        shutil.copy2(input_path, output_path)
        return False


def classify_image_with_ai(image_path, max_retries=3):
    """Classify a real estate photo using OpenAI Vision API"""
    if not OPENAI_AVAILABLE:
        return None

    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        print("⚠️  OPENAI_API_KEY not found in environment variables")
        return None

    client = openai.OpenAI(api_key=api_key)

    try:
        # Convert image to base64
        with open(image_path, "rb") as image_file:
            base64_image = base64.b64encode(image_file.read()).decode("utf-8")

        # Retry logic for API calls
        for attempt in range(max_retries):
            try:
                response = client.chat.completions.create(
                    model="gpt-4o-mini",  # Using the more cost-effective model
                    messages=[
                        {
                            "role": "user",
                            "content": [
                                {
                                    "type": "text",
                                    "text": """Classify this real estate photo. Look at the room type and respond with exactly ONE word from this list:
exterior, living, kitchen, dining, bedroom, master, bathroom, garage, closet, laundry, utility, storage, office, family, den, guest, basement, attic

Choose the most specific and accurate room type. For outdoor/exterior shots, use 'exterior'. For bedrooms that appear to be master/primary bedrooms, use 'master'. For general living areas, use 'living'. Respond with only the single word.""",
                                },
                                {
                                    "type": "image_url",
                                    "image_url": {
                                        "url": f"data:image/jpeg;base64,{base64_image}",
                                        "detail": "low",  # Use low detail to reduce costs
                                    },
                                },
                            ],
                        }
                    ],
                    max_tokens=10,
                    temperature=0,  # Make it deterministic
                )

                classification = response.choices[0].message.content.strip().lower()

                # Validate the response is one of our expected room types
                valid_types = {
                    "exterior",
                    "living",
                    "kitchen",
                    "dining",
                    "bedroom",
                    "master",
                    "bathroom",
                    "garage",
                    "closet",
                    "laundry",
                    "utility",
                    "storage",
                    "office",
                    "family",
                    "den",
                    "guest",
                    "basement",
                    "attic",
                }

                if classification in valid_types:
                    return classification
                else:
                    print(
                        f"   ⚠️  Unexpected classification '{classification}', retrying..."
                    )
                    continue

            except Exception as api_error:
                if attempt < max_retries - 1:
                    print(f"   ⚠️  API call failed (attempt {attempt + 1}), retrying...")
                    continue
                else:
                    print(
                        f"   ❌ Failed to classify {image_path} after {max_retries} attempts: {api_error}"
                    )
                    return None

        return None  # All retries failed

    except Exception as e:
        print(f"   ❌ Error processing image {image_path}: {e}")
        return None


def get_existing_release_assets(tag_name):
    """Get list of existing assets in the GitHub release"""
    try:
        result = subprocess.run(
            ["gh", "release", "view", tag_name, "--json", "assets"],
            capture_output=True,
            text=True,
            check=True,
        )
        release_data = json.loads(result.stdout)
        return [asset["name"] for asset in release_data.get("assets", [])]
    except (subprocess.CalledProcessError, json.JSONDecodeError):
        return []


def upload_photos_to_release(
    tag_name,
    photo_urls,
    base_photos_dir,
    force_reupload=False,
    max_width=1920,
    max_height=1080,
    quality=85,
    no_downsample=False,
    use_ai_classification=False,
):
    """Upload photos to GitHub release using GitHub CLI"""
    print(f"\n📤 Preparing to upload {len(photo_urls)} photos to release...")

    # Check if GitHub CLI is installed
    try:
        subprocess.run(["gh", "--version"], capture_output=True, check=True)
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("❌ GitHub CLI (gh) not found. Please install it first:")
        print("   brew install gh")
        print("   Then authenticate: gh auth login")
        return False

    # Check if release exists, create if it doesn't
    try:
        result = subprocess.run(
            ["gh", "release", "view", tag_name],
            capture_output=True,
            text=True,
            check=True,
        )
        print(f"   ✅ Release {tag_name} already exists")
    except subprocess.CalledProcessError:
        # Release doesn't exist, create it
        print(f"   🆕 Creating new release {tag_name}...")
        try:
            # Extract shoot name for title
            shoot_name = tag_name.replace("real-estate-", "").replace("-v1.0", "")
            title = f"{shoot_name.replace('-', ' ').title()} - Real Estate Photos"
            notes = f"Professional aerial photography showcasing {shoot_name.replace('-', ' ')}. {len(photo_urls)} high-quality photos featuring exterior views, architectural details, and property highlights."

            create_cmd = [
                "gh",
                "release",
                "create",
                tag_name,
                "--title",
                title,
                "--notes",
                notes,
            ]
            subprocess.run(create_cmd, capture_output=True, text=True, check=True)
            print(f"   ✅ Created release {tag_name}")
        except subprocess.CalledProcessError as e:
            print(f"   ❌ Failed to create release: {e}")
            if e.stderr:
                print(f"   Error details: {e.stderr}")
            return False

    # Get existing assets in the release
    existing_assets = get_existing_release_assets(tag_name)
    print(f"   📋 Found {len(existing_assets)} existing assets in release")

    # Filter out photos that already exist (unless force_reupload)
    photos_to_upload = []
    skipped_photos = []
    photos_to_delete = []

    if force_reupload:
        print("   🔄 Force re-upload mode: will replace existing photos")
        photos_to_upload = photo_urls
        # Mark existing photos for deletion
        for photo_data in photo_urls:
            if photo_data["filename"] in existing_assets:
                photos_to_delete.append(photo_data["filename"])
    else:
        for photo_data in photo_urls:
            if photo_data["filename"] in existing_assets:
                skipped_photos.append(photo_data["filename"])
            else:
                photos_to_upload.append(photo_data)

    # Delete existing photos if force re-upload
    if photos_to_delete:
        print(
            f"   🗑️  Deleting {len(photos_to_delete)} existing photos for re-upload..."
        )
        try:
            delete_cmd = (
                ["gh", "release", "delete-asset", tag_name]
                + photos_to_delete
                + ["--yes"]
            )
            subprocess.run(delete_cmd, capture_output=True, text=True, check=True)
            print(f"   ✅ Deleted {len(photos_to_delete)} existing photos")
        except subprocess.CalledProcessError as e:
            print(f"   ⚠️  Warning: Could not delete some existing photos: {e}")

    if skipped_photos:
        print(f"   ⏭️  Skipping {len(skipped_photos)} photos that already exist:")
        for filename in skipped_photos[:5]:  # Show first 5
            print(f"      {filename}")
        if len(skipped_photos) > 5:
            print(f"      ... and {len(skipped_photos) - 5} more")

    if not photos_to_upload:
        print("✅ All photos already exist in release - nothing to upload!")
        return True

    print(
        f"   📸 Will upload {len(photos_to_upload)} {'new ' if not force_reupload else ''}photos"
    )

    # Create temporary directory for renamed files
    with tempfile.TemporaryDirectory() as temp_dir:
        print(f"   📁 Creating temporary renamed files...")

        # Copy and rename files to temp directory with downsampling
        temp_files = []
        downsampled_count = 0

        for photo_data in photos_to_upload:
            original_path = None

            # Find the original file path
            for photo_file in Path(base_photos_dir).glob("**/*"):
                if (
                    photo_file.is_file()
                    and photo_file.name == photo_data["original_filename"]
                ):
                    original_path = photo_file
                    break

            if not original_path:
                print(
                    f"   ⚠️  Warning: Could not find {photo_data['original_filename']}"
                )
                continue

            # Process and save file with new name to temp directory
            temp_file_path = Path(temp_dir) / photo_data["filename"]

            if no_downsample:
                # Just copy without downsampling
                shutil.copy2(original_path, temp_file_path)
            else:
                # Convert to .jpg for consistency and smaller file size
                temp_file_path = temp_file_path.with_suffix(".jpg")
                photo_data["filename"] = temp_file_path.name  # Update filename in data

                if downsample_image(
                    original_path, temp_file_path, max_width, max_height, quality
                ):
                    downsampled_count += 1

            temp_files.append(str(temp_file_path))

        if not temp_files:
            print("❌ No new files to upload")
            return (
                len(skipped_photos) > 0
            )  # Return True if we skipped files (means some success)

        if downsampled_count > 0:
            print(f"   🔧 Downsampled {downsampled_count} images for web optimization")

        # AI Classification of downsampled images if requested
        if use_ai_classification and OPENAI_AVAILABLE:
            print(f"   🤖 Classifying {len(temp_files)} downsampled images...")
            classified_files = []

            for i, temp_file_path in enumerate(temp_files):
                temp_path = Path(temp_file_path)
                original_photo_data = photo_urls[i]

                print(f"   🤖 Classifying {temp_path.name}...")
                room_type = classify_image_with_ai(str(temp_path))

                if room_type:
                    print(f"   ✅ Classified as: {room_type}")

                    # Generate new filename with room classification
                    shoot_name = tag_name.replace("real-estate-", "").replace(
                        "-v1.0", ""
                    )
                    prefix = generate_unique_prefix(shoot_name, "hash")

                    new_filename = generate_prefixed_filename(
                        original_photo_data["original_filename"],
                        prefix,
                        room_type=room_type,
                    )

                    # Rename the temp file
                    new_temp_path = temp_path.parent / new_filename
                    temp_path.rename(new_temp_path)
                    classified_files.append(str(new_temp_path))

                    # Update the photo_urls data for consistency
                    photo_urls[i]["filename"] = new_filename
                else:
                    print(f"   ⚠️  Could not classify, keeping original name")
                    classified_files.append(temp_file_path)

            temp_files = classified_files

        print(f"   📸 Prepared {len(temp_files)} files for upload")

        # Upload files to release using GitHub CLI
        try:
            cmd = ["gh", "release", "upload", tag_name] + temp_files
            print(
                f"   🚀 Uploading {len(temp_files)} new files to release {tag_name}..."
            )

            result = subprocess.run(cmd, capture_output=True, text=True, check=True)
            print(f"✅ Successfully uploaded {len(temp_files)} new photos!")
            if skipped_photos:
                print(
                    f"   📊 Total: {len(temp_files)} uploaded + {len(skipped_photos)} existing = {len(photo_urls)} total photos"
                )
            return True

        except subprocess.CalledProcessError as e:
            print(f"❌ Failed to upload files: {e}")
            if e.stderr:
                print(f"   Error details: {e.stderr}")
            return False


def create_release_tag(shoot_name, version="v1.0"):
    """Create a git tag for the photo release"""
    tag_name = f"real-estate-{shoot_name}-{version}"

    try:
        # Check if tag already exists
        result = subprocess.run(
            ["git", "tag", "-l", tag_name], capture_output=True, text=True
        )
        if result.stdout.strip():
            print(f"Tag {tag_name} already exists!")
            return tag_name

        # Create and push tag
        subprocess.run(["git", "tag", tag_name], check=True)
        subprocess.run(["git", "push", "origin", tag_name], check=True)
        print(f"✅ Created and pushed tag: {tag_name}")
        return tag_name
    except subprocess.CalledProcessError as e:
        print(f"❌ Error creating tag: {e}")
        return None


def generate_github_urls(
    shoot_name,
    photo_files,
    tag_name,
    base_photos_dir,
    use_prefix=True,
    prefix_method="hash",
    sequential_numbering=False,
    use_ai_classification=False,
):
    """Generate GitHub release URLs for photos with unique prefixes"""
    base_url = "https://github.com/smithclint/waypoint-media-site/releases/download"
    urls = []

    # Generate unique prefix for this shoot
    if use_prefix:
        prefix = generate_unique_prefix(shoot_name, prefix_method)

    for counter, photo_file in enumerate(photo_files, 1):
        original_filename = os.path.basename(photo_file)

        # Generate new filename with prefix (no AI classification here - done later)
        if use_prefix:
            if sequential_numbering:
                new_filename = generate_prefixed_filename(
                    original_filename, prefix, counter
                )
            else:
                new_filename = generate_prefixed_filename(original_filename, prefix)
        else:
            new_filename = original_filename

        url = f"{base_url}/{tag_name}/{new_filename}"

        # Generate caption with subdirectory context
        photo_path = Path(photo_file)
        base_path = Path(base_photos_dir)

        # Get relative path from base directory
        try:
            relative_path = photo_path.relative_to(base_path)
            # Get parent directory name if it exists
            if len(relative_path.parts) > 1:
                subdir = relative_path.parent.name
                # Clean up filename for caption (use original name, not prefixed)
                file_caption = (
                    original_filename.replace(".jpg", "")
                    .replace(".jpeg", "")
                    .replace(".png", "")
                    .replace(".webp", "")
                )
                file_caption = file_caption.replace("-", " ").replace("_", " ").title()
                # Combine subdirectory and filename
                caption = f"{subdir.replace('-', ' ').replace('_', ' ').title()} - {file_caption}"
            else:
                # No subdirectory, just use filename
                caption = (
                    original_filename.replace(".jpg", "")
                    .replace(".jpeg", "")
                    .replace(".png", "")
                    .replace(".webp", "")
                )
                caption = caption.replace("-", " ").replace("_", " ").title()
        except ValueError:
            # Fallback if relative path calculation fails
            caption = (
                original_filename.replace(".jpg", "")
                .replace(".jpeg", "")
                .replace(".png", "")
                .replace(".webp", "")
            )
            caption = caption.replace("-", " ").replace("_", " ").title()

        urls.append(
            {
                "url": url,
                "caption": caption,
                "filename": new_filename,
                "original_filename": original_filename,
                "subdirectory": (
                    relative_path.parent.name if len(relative_path.parts) > 1 else None
                ),
                "counter": counter if sequential_numbering else None,
            }
        )

    return urls


def update_photos_json(shoot_id, shoot_data):
    """Update photos.json with new shoot data"""
    photos_file = "photos.json"

    # Load existing data
    if os.path.exists(photos_file):
        with open(photos_file, "r") as f:
            data = json.load(f)
    else:
        data = {}

    # Add/update shoot
    data[shoot_id] = shoot_data

    # Save updated data
    with open(photos_file, "w") as f:
        json.dump(data, f, indent=2)

    print(f"✅ Updated {photos_file} with {shoot_id} data")


def main():
    parser = argparse.ArgumentParser(description="Prepare photos for GitHub releases")
    parser.add_argument(
        "--shoot", required=True, help="Shoot name (e.g., sugar-mill-pool-home)"
    )
    parser.add_argument("--photos", required=True, help="Directory containing photos")
    parser.add_argument("--title", help="Display title for the shoot")
    parser.add_argument("--description", help="Description of the shoot")
    parser.add_argument(
        "--featured-photo",
        type=int,
        default=0,
        help="Index of the photo to use as the main preview (0-based, default: 0)",
    )
    parser.add_argument(
        "--category",
        default="residential",
        choices=[
            "luxury-homes",
            "commercial",
            "residential",
            "waterfront",
            "golf-course",
        ],
        help="Photo category",
    )
    parser.add_argument("--version", default="v1.0", help="Release version")
    parser.add_argument(
        "--dry-run", action="store_true", help="Preview without making changes"
    )
    parser.add_argument(
        "--max-depth",
        type=int,
        help="Maximum directory depth for recursive search (default: unlimited)",
    )
    parser.add_argument(
        "--include-subdir",
        action="store_true",
        default=True,
        help="Include subdirectory names in photo captions (default: True)",
    )
    parser.add_argument(
        "--no-subdir",
        action="store_true",
        help="Do not include subdirectory names in captions",
    )
    parser.add_argument(
        "--no-prefix",
        action="store_true",
        help="Do not add unique prefixes to filenames",
    )
    parser.add_argument(
        "--prefix-method",
        default="hash",
        choices=["hash", "simple", "sequential"],
        help="Method for generating unique prefixes (default: hash)",
    )
    parser.add_argument(
        "--sequential",
        action="store_true",
        help="Add sequential numbering to filenames (001, 002, etc.)",
    )
    parser.add_argument(
        "--preview-names",
        action="store_true",
        help="Show original vs new filenames without making changes",
    )
    parser.add_argument(
        "--auto-upload",
        action="store_true",
        help="Automatically upload photos to GitHub release (requires gh CLI)",
    )
    parser.add_argument(
        "--upload-only",
        action="store_true",
        help="Only upload photos to existing release, skip other steps",
    )
    parser.add_argument(
        "--force-reupload",
        action="store_true",
        help="Force re-upload of all photos, even if they already exist",
    )
    parser.add_argument(
        "--max-width",
        type=int,
        default=1920,
        help="Maximum width for downsampled images (default: 1920)",
    )
    parser.add_argument(
        "--max-height",
        type=int,
        default=1080,
        help="Maximum height for downsampled images (default: 1080)",
    )
    parser.add_argument(
        "--quality",
        type=int,
        default=85,
        help="JPEG quality for downsampled images (1-100, default: 85)",
    )
    parser.add_argument(
        "--no-downsample",
        action="store_true",
        help="Skip image downsampling (upload original sizes)",
    )
    parser.add_argument(
        "--ai-classify",
        action="store_true",
        help="Use OpenAI Vision API to automatically classify room types and include in filenames",
    )

    args = parser.parse_args()

    # Validate photos directory
    if not os.path.exists(args.photos):
        print(f"❌ Photos directory not found: {args.photos}")
        return

    # Find photo files (recursive search)
    photo_extensions = [".jpg", ".jpeg", ".png", ".webp"]
    photo_files = []

    # Build glob pattern based on max_depth
    if args.max_depth:
        # Create pattern with limited depth
        patterns = []
        for depth in range(args.max_depth + 1):
            if depth == 0:
                patterns.append("*")
            else:
                patterns.append("*/" * depth + "*")

        for pattern in patterns:
            for ext in photo_extensions:
                photo_files.extend(Path(args.photos).glob(f"{pattern}{ext}"))
                photo_files.extend(Path(args.photos).glob(f"{pattern}{ext.upper()}"))
    else:
        # Unlimited depth recursive search
        for ext in photo_extensions:
            photo_files.extend(Path(args.photos).glob(f"**/*{ext}"))
            photo_files.extend(Path(args.photos).glob(f"**/*{ext.upper()}"))

    if not photo_files:
        print(f"❌ No photo files found in {args.photos}")
        return

    photo_files = sorted([str(f) for f in photo_files])
    print(f"📸 Found {len(photo_files)} photos:")

    # Group photos by subdirectory for better display
    photos_by_dir = {}
    for photo in photo_files:
        photo_path = Path(photo)
        base_path = Path(args.photos)
        try:
            relative_path = photo_path.relative_to(base_path)
            if len(relative_path.parts) > 1:
                subdir = relative_path.parent.name
            else:
                subdir = "root"

            if subdir not in photos_by_dir:
                photos_by_dir[subdir] = []
            photos_by_dir[subdir].append(os.path.basename(photo))
        except ValueError:
            photos_by_dir["root"] = photos_by_dir.get("root", []) + [
                os.path.basename(photo)
            ]

    # Display organized by directory
    for subdir, files in photos_by_dir.items():
        if subdir == "root":
            print(f"   📁 Root directory ({len(files)} photos):")
        else:
            print(f"   📁 {subdir}/ ({len(files)} photos):")
        for photo_file in files[:3]:  # Show first 3 files
            print(f"      {photo_file}")
        if len(files) > 3:
            print(f"      ... and {len(files) - 3} more")

    if args.dry_run or args.preview_names:
        if args.preview_names:
            print("\n🔍 FILENAME PREVIEW")
        else:
            print("\n🔍 DRY RUN - No changes will be made")

    # Create release tag
    if args.upload_only:
        # For upload-only mode, assume tag exists
        tag_name = f"real-estate-{args.shoot}-{args.version}"
        print(f"🏷️  Using existing tag: {tag_name}")
    elif not args.dry_run and not args.preview_names:
        tag_name = create_release_tag(args.shoot, args.version)
        if not tag_name:
            return
    else:
        tag_name = f"real-estate-{args.shoot}-{args.version}"
        if not args.preview_names:
            print(f"🏷️  Would create tag: {tag_name}")

    # Generate URLs with prefix options
    use_prefix = not args.no_prefix
    include_subdir = args.include_subdir and not args.no_subdir

    if not include_subdir:
        # Use simplified function without subdirectory context
        def generate_github_urls_no_subdir(
            shoot_name,
            photo_files,
            tag_name,
            base_photos_dir,
            use_prefix,
            prefix_method,
            sequential_numbering,
            use_ai_classification=False,
        ):
            urls = []
            base_url = (
                "https://github.com/smithclint/waypoint-media-site/releases/download"
            )

            if use_prefix:
                prefix = generate_unique_prefix(shoot_name, prefix_method)

            for counter, photo_file in enumerate(photo_files, 1):
                original_filename = os.path.basename(photo_file)

                if use_prefix:
                    if sequential_numbering:
                        new_filename = generate_prefixed_filename(
                            original_filename, prefix, counter
                        )
                    else:
                        new_filename = generate_prefixed_filename(
                            original_filename, prefix
                        )
                else:
                    new_filename = original_filename

                url = f"{base_url}/{tag_name}/{new_filename}"
                caption = (
                    original_filename.replace(".jpg", "")
                    .replace(".jpeg", "")
                    .replace(".png", "")
                    .replace(".webp", "")
                )
                caption = caption.replace("-", " ").replace("_", " ").title()

                urls.append(
                    {
                        "url": url,
                        "caption": caption,
                        "filename": new_filename,
                        "original_filename": original_filename,
                        "subdirectory": None,
                        "counter": counter if sequential_numbering else None,
                    }
                )
            return urls

        photo_urls = generate_github_urls_no_subdir(
            args.shoot,
            photo_files,
            tag_name,
            args.photos,
            use_prefix,
            args.prefix_method,
            args.sequential,
            args.ai_classify,
        )
    else:
        photo_urls = generate_github_urls(
            args.shoot,
            photo_files,
            tag_name,
            args.photos,
            use_prefix,
            args.prefix_method,
            args.sequential,
            args.ai_classify,
        )

    # Show filename preview if requested
    if args.preview_names:
        print(f"\n📝 Filename mapping for shoot '{args.shoot}':")
        if use_prefix:
            prefix = generate_unique_prefix(args.shoot, args.prefix_method)
            print(f"   Prefix: {prefix}")
            print(f"   Method: {args.prefix_method}")
            if args.sequential:
                print(f"   Sequential numbering: enabled")
        else:
            print("   No prefixes will be added")

        print(f"\n   Original → New filename:")
        for photo_data in photo_urls:
            print(f"   {photo_data['original_filename']} → {photo_data['filename']}")
        return

    # Prepare shoot data with simplified structure
    shoot_data = {
        "title": args.title or args.shoot.replace("-", " ").title(),
        "description": args.description
        or f"Professional aerial photography of {args.shoot.replace('-', ' ')}",
        "category": args.category,
        "release_tag": tag_name,
        "shoot_prefix": (
            generate_unique_prefix(args.shoot, args.prefix_method)
            if use_prefix
            else None
        ),
        "featured_photo_index": args.featured_photo,
    }

    # Update photos.json
    if not args.dry_run and not args.upload_only:
        update_photos_json(args.shoot, shoot_data)
    elif not args.upload_only:
        print(f"\n📄 Would update photos.json with:")
        print(json.dumps({args.shoot: shoot_data}, indent=2))

    # Auto-upload photos if requested
    if args.auto_upload and not args.dry_run and not args.preview_names:
        upload_success = upload_photos_to_release(
            tag_name,
            photo_urls,
            args.photos,
            args.force_reupload,
            args.max_width,
            args.max_height,
            args.quality,
            args.no_downsample,
            args.ai_classify,
        )
        if upload_success:
            print(f"\n🎉 Complete! Photos uploaded and website updated.")
            print(
                f"📱 View your portfolio at: https://waypointmediapro.com/real-estate.html"
            )
            if not args.upload_only:
                print(f"\n4. Commit and push photos.json changes:")
                print(f"   git add photos.json")
                print(f"   git commit -m 'Add {args.shoot} real estate photos'")
                print(f"   git push origin main")
            return
        else:
            print(f"\n⚠️  Upload failed, but you can upload manually:")

    if args.upload_only:
        # For upload-only mode, try to upload without updating photos.json
        if args.auto_upload:
            upload_photos_to_release(
                tag_name,
                photo_urls,
                args.photos,
                args.force_reupload,
                args.max_width,
                args.max_height,
                args.quality,
                args.no_downsample,
                args.ai_classify,
            )
        return

    # Print upload instructions with filename mapping
    print(f"\n📤 Next steps:")
    print(
        f"1. Go to: https://github.com/smithclint/waypoint-media-site/releases/tag/{tag_name}"
    )
    print(f"2. Click 'Edit tag' → 'Edit release'")

    if use_prefix:
        print(f"3. Upload files with these NEW NAMES (rename during upload):")
        print(f"   ⚠️  IMPORTANT: You must rename each file when uploading!")
    else:
        print(f"3. Upload these files (keep original names):")

    # Group files by subdirectory for upload instructions
    files_by_dir = {}
    for photo_data in photo_urls:
        subdir = photo_data.get("subdirectory", "root")
        if subdir not in files_by_dir:
            files_by_dir[subdir] = []
        files_by_dir[subdir].append(photo_data)

    file_num = 1
    for subdir, photo_data_list in files_by_dir.items():
        if subdir != "root" and subdir is not None:
            print(f"   📁 From {subdir}/ folder:")
        for photo_data in photo_data_list:
            if use_prefix and photo_data["filename"] != photo_data["original_filename"]:
                print(
                    f"   {file_num}. {photo_data['original_filename']} → RENAME TO → {photo_data['filename']}"
                )
            else:
                print(f"   {file_num}. {photo_data['filename']}")
            file_num += 1

    print(f"\n4. Commit and push photos.json changes:")
    print(f"   git add photos.json")
    print(f"   git commit -m 'Add {args.shoot} real estate photos'")
    print(f"   git push origin main")

    print(f"\n🌐 Photos will be available at:")
    for photo_data in photo_urls:
        print(f"   {photo_data['url']}")


if __name__ == "__main__":
    main()
