#!/usr/bin/env python3
"""
S3/CloudFront Photo Uploader for Waypoint Media Site

This script uploads photos to S3 bucket with CloudFront CDN integration.
Based on the original release_photos.py but updated for S3 workflow.

Usage: python3 release_photos_s3.py --shoot open-range-rv --photos path/to/photos/
"""

import argparse
import base64
import hashlib
import json
import os
import shutil
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

try:
    import boto3
    from botocore.exceptions import ClientError, NoCredentialsError

    BOTO3_AVAILABLE = True
except ImportError:
    BOTO3_AVAILABLE = False
    print("⚠️  boto3 not available. Install with: pip install boto3")
    print("   S3 upload will not work.")

# Configuration
S3_BUCKET = os.getenv("S3_BUCKET", "waypoint-media-pro")  # Default bucket name
CLOUDFRONT_DOMAIN = "https://d1fp8ti9bzsng5.cloudfront.net"
PHOTOS_CONFIG = "config/photos.json"


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
                        "   ⚠️  Unexpected classification '{}', retrying...".format(
                            classification
                        )
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


def upload_photos_to_s3(
    shoot_name,
    photo_urls,
    base_photos_dir,
    force_reupload=False,
    max_width=1920,
    max_height=1080,
    quality=85,
    no_downsample=False,
    use_ai_classification=False,
):
    """Upload photos to S3 bucket"""
    if not BOTO3_AVAILABLE:
        print("❌ boto3 not installed. Please install with: pip install boto3")
        return False

    print(f"\n📤 Preparing to upload {len(photo_urls)} photos to S3...")

    # Initialize S3 client
    try:
        s3_client = boto3.client("s3")
        # Test credentials by listing buckets
        s3_client.list_buckets()
        print("   ✅ AWS credentials configured")
    except NoCredentialsError:
        print("❌ AWS credentials not found. Please configure with:")
        print("   aws configure")
        print(
            "   Or set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables"
        )
        return False
    except ClientError as e:
        print(f"❌ AWS error: {e}")
        return False

    # Check if bucket exists
    try:
        s3_client.head_bucket(Bucket=S3_BUCKET)
        print("   ✅ S3 bucket '{}' accessible".format(S3_BUCKET))
    except ClientError as e:
        error_code = e.response["Error"]["Code"]
        if error_code == "404":
            print("❌ S3 bucket '{}' not found".format(S3_BUCKET))
        else:
            print("❌ Cannot access S3 bucket '{}': {}".format(S3_BUCKET, e))
        return False

    # Get existing objects in the shoot folder
    try:
        response = s3_client.list_objects_v2(Bucket=S3_BUCKET, Prefix=f"{shoot_name}/")
        existing_objects = [obj["Key"] for obj in response.get("Contents", [])]
        print(f"   📋 Found {len(existing_objects)} existing objects in S3")
    except ClientError as e:
        print(f"   ⚠️  Error listing S3 objects: {e}")
        existing_objects = []

    # Filter out photos that already exist (unless force_reupload)
    photos_to_upload = []
    skipped_photos = []

    if force_reupload:
        print("   🔄 Force re-upload mode: will replace existing photos")
        photos_to_upload = photo_urls
    else:
        for photo_data in photo_urls:
            s3_key = f"{shoot_name}/{photo_data['filename']}"
            if s3_key in existing_objects:
                skipped_photos.append(photo_data["filename"])
            else:
                photos_to_upload.append(photo_data)

    if skipped_photos:
        print(f"   ⏭️  Skipping {len(skipped_photos)} photos that already exist:")
        for filename in skipped_photos[:5]:  # Show first 5
            print(f"      {filename}")
        if len(skipped_photos) > 5:
            print(f"      ... and {len(skipped_photos) - 5} more")

    if not photos_to_upload:
        print("✅ All photos already exist in S3 - nothing to upload!")
        return True

    print(
        f"   📸 Will upload {len(photos_to_upload)} {'new ' if not force_reupload else ''}photos"
    )

    # Create temporary directory for renamed files
    with tempfile.TemporaryDirectory() as temp_dir:
        print(f"   📁 Creating temporary optimized files...")

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

            temp_files.append((str(temp_file_path), photo_data))

        if not temp_files:
            print("❌ No new files to upload")
            return len(skipped_photos) > 0

        if downsampled_count > 0:
            print(f"   🔧 Downsampled {downsampled_count} images for web optimization")

        # AI Classification of downsampled images if requested
        if use_ai_classification and OPENAI_AVAILABLE:
            print(f"   🤖 Classifying {len(temp_files)} images...")
            classified_files = []

            for i, (temp_file_path, photo_data) in enumerate(temp_files):
                temp_path = Path(temp_file_path)

                print(f"   🤖 Classifying {temp_path.name}...")
                room_type = classify_image_with_ai(str(temp_path))

                if room_type:
                    print(f"   ✅ Classified as: {room_type}")

                    # Generate new filename with room classification
                    prefix = generate_unique_prefix(shoot_name, "hash")

                    new_filename = generate_prefixed_filename(
                        photo_data["original_filename"],
                        prefix,
                        room_type=room_type,
                    )

                    # Rename the temp file
                    new_temp_path = temp_path.parent / new_filename
                    temp_path.rename(new_temp_path)
                    classified_files.append((str(new_temp_path), photo_data))

                    # Update the photo_data for consistency
                    photo_data["filename"] = new_filename
                else:
                    print(f"   ⚠️  Could not classify, keeping original name")
                    classified_files.append((temp_file_path, photo_data))

            temp_files = classified_files

        print(f"   📸 Prepared {len(temp_files)} files for S3 upload")

        # Upload files to S3
        try:
            uploaded_count = 0
            for temp_file_path, photo_data in temp_files:
                s3_key = f"{shoot_name}/{photo_data['filename']}"

                print(f"   📤 Uploading {photo_data['filename']}...")

                # Upload file with proper content type
                content_type = "image/jpeg"
                if photo_data["filename"].lower().endswith(".png"):
                    content_type = "image/png"
                elif photo_data["filename"].lower().endswith(".webp"):
                    content_type = "image/webp"

                s3_client.upload_file(
                    temp_file_path,
                    S3_BUCKET,
                    s3_key,
                    ExtraArgs={
                        "ContentType": content_type,
                        "CacheControl": "max-age=31536000",  # 1 year cache
                    },
                )
                uploaded_count += 1

            print(f"✅ Successfully uploaded {uploaded_count} photos to S3!")

            # Invalidate CloudFront cache if needed
            print(f"   🔄 Consider invalidating CloudFront cache for /{shoot_name}/*")

            if skipped_photos:
                print(
                    f"   📊 Total: {uploaded_count} uploaded + {len(skipped_photos)} existing = {len(photo_urls)} total photos"
                )
            return True

        except ClientError as e:
            print(f"❌ Failed to upload files to S3: {e}")
            return False


def update_photos_json(shoot_id, shoot_data):
    """Update photos.json with new shoot data"""
    photos_file = PHOTOS_CONFIG

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


def generate_photo_urls(
    shoot_name,
    photo_files,
    base_photos_dir,
    use_prefix=True,
    prefix_method="hash",
    sequential_numbering=False,
    use_ai_classification=False,
):
    """Generate S3/CloudFront URLs for photos with unique prefixes"""
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
                "filename": new_filename,
                "original_filename": original_filename,
                "caption": caption,
                "subdirectory": (
                    relative_path.parent.name if len(relative_path.parts) > 1 else None
                ),
                "counter": counter if sequential_numbering else None,
            }
        )

    return urls


def main():
    parser = argparse.ArgumentParser(description="Upload photos to S3/CloudFront")
    parser.add_argument(
        "--shoot", required=True, help="Shoot name (e.g., open-range-rv)"
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
            "rv-resort",
            "campground",
            "recreational-vehicles",
        ],
        help="Photo category",
    )
    parser.add_argument(
        "--dry-run", action="store_true", help="Preview without making changes"
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
        help="Automatically upload photos to S3 bucket",
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

    # Generate photo data
    use_prefix = not args.no_prefix

    photo_data = generate_photo_urls(
        args.shoot,
        photo_files,
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
        for photo in photo_data:
            print(f"   {photo['original_filename']} → {photo['filename']}")
        return

    # Prepare shoot metadata for photos.json
    shoot_data = {
        "title": args.title or args.shoot.replace("-", " ").title(),
        "description": args.description
        or f"Professional aerial photography of {args.shoot.replace('-', ' ')}",
        "category": args.category,
        "images": [
            photo["filename"] for photo in photo_data
        ],  # Just filenames for S3/CloudFront
        "featured_photo_index": args.featured_photo,
    }

    # Update photos.json
    if not args.dry_run:
        update_photos_json(args.shoot, shoot_data)
    else:
        print(f"\n📄 Would update {PHOTOS_CONFIG} with:")
        print(json.dumps({args.shoot: shoot_data}, indent=2))

    # Auto-upload photos if requested
    if args.auto_upload and not args.dry_run and not args.preview_names:
        upload_success = upload_photos_to_s3(
            args.shoot,
            photo_data,
            args.photos,
            args.force_reupload,
            args.max_width,
            args.max_height,
            args.quality,
            args.no_downsample,
            args.ai_classify,
        )
        if upload_success:
            print(f"\n🎉 Complete! Photos uploaded to S3 and website updated.")
            print(
                f"📱 View your portfolio at: https://waypointmediapro.com/real-estate"
            )
            print(f"🌐 Photos available at: {CLOUDFRONT_DOMAIN}/{args.shoot}/")

            print(f"\n4. Commit and push configuration changes:")
            print(f"   git add {PHOTOS_CONFIG}")
            print(f"   git commit -m 'Add {args.shoot} real estate photos'")
            print(f"   git push origin main")
            return
        else:
            print(f"\n⚠️  Upload failed.")

    # Print CloudFront URLs that will be generated
    print(f"\n🌐 Photos will be available at:")
    for photo in photo_data[:5]:  # Show first 5
        print(f"   {CLOUDFRONT_DOMAIN}/{args.shoot}/{photo['filename']}")
    if len(photo_data) > 5:
        print(f"   ... and {len(photo_data) - 5} more")


if __name__ == "__main__":
    main()
