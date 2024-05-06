import sys
import json
from moviepy.editor import concatenate_videoclips, ImageClip, CompositeVideoClip, TextClip
from PIL import Image, ImageOps
import requests
import os
import numpy as np

def download_image(url, filename):
    response = requests.get(url)
    with open(filename, 'wb') as file:
        file.write(response.content)

def resize_image(input_path, output_path, base_width=1080, aspect_ratio=(9, 16)):
    with Image.open(input_path) as img:
        # Check if the image has an alpha channel and convert it
        if img.mode == 'RGBA':
            img = img.convert('RGB')

        base_height = int(base_width * (aspect_ratio[1] / aspect_ratio[0]))
        img.thumbnail((base_width, base_height), Image.Resampling.LANCZOS)
        padding_height = (base_height - img.height) // 2
        padding_width = (base_width - img.width) // 2
        img_with_padding = ImageOps.expand(img, (padding_width, padding_height), fill='white')
        img_with_padding.save(output_path, 'JPEG')


def create_caption_box(text, video_clip, height, start_time, duration):
    width = video_clip.w
    position_y = int(video_clip.h * 0.7 - height / 2)
    color_img = Image.new("RGB", (width, height), color=(255, 0, 0))
    color_npimg = np.array(color_img)
    color_clip = ImageClip(color_npimg).set_duration(duration)
    caption = TextClip(text, fontsize=50, color='white', font='Arial-Bold', size=(width - 10, height - 10), method='caption').set_duration(duration)
    caption_composite = CompositeVideoClip([color_clip, caption.set_position('center')], size=(width, height))
    caption_composite = caption_composite.set_position(("center", position_y)).set_start(start_time)
    return caption_composite

def split_summary(summary, max_length=60):
    words = summary.split()
    lines = []
    current_line = []
    for word in words:
        if len(' '.join(current_line + [word])) <= max_length:
            current_line.append(word)
        else:
            lines.append(' '.join(current_line))
            current_line = [word]
    lines.append(' '.join(current_line))
    return lines

def main(input_json):
    data = json.loads(input_json)
    image_urls = data['image_urls']
    captions = data['captions']

    images_dir = "downloaded_images"
    if not os.path.exists(images_dir):
        os.makedirs(images_dir, exist_ok=True)  # Add exist_ok=True here


    resized_image_paths = []
    for i, url in enumerate(image_urls, start=1):
        original_filename = os.path.join(images_dir, f"original_image_{i}.jpg")
        download_image(url, original_filename)
        resized_filename = os.path.join(images_dir, f"resized_image_{i}.jpg")
        resize_image(original_filename, resized_filename)
        resized_image_paths.append(resized_filename)

    clips = [ImageClip(img_path).set_duration(4) for img_path in resized_image_paths]
    video_clip = concatenate_videoclips(clips, method="compose")
    caption_clips = [create_caption_box(captions[i], video_clip, 120, start_time=i*4, duration=4) for i in range(len(captions))]

    final_clip_with_captions = CompositeVideoClip([video_clip] + caption_clips, size=(1080, video_clip.h + 120))
    output_dir = os.path.join(os.path.dirname(__file__), '..', 'public', 'uploads')
    
    # Ensure the output directory exists
    if not os.path.exists(output_dir):
        os.makedirs(output_dir, exist_ok=True)
    
    # Define the output video filename
    output_filename = "output_video_with_captions.mp4"  # You can add timestamp or UUID for unique filenames if you like
    
    # Define the full output path
    output_file_path = os.path.join(output_dir, output_filename)
    
    # Save the video file to the specified path
    final_clip_with_captions.write_videofile(output_file_path, codec="libx264", fps=24)
    
    # Print the path or any other success message
    print(f"Video saved to {output_file_path}")

# The standard boilerplate to run the main method
if __name__ == "__main__":
    main(sys.argv[1])

