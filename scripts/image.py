import sys
import requests
from PIL import Image, ImageDraw, ImageFont
from io import BytesIO

def wrap_text(text, font, max_width):
    lines = []
    words = text.split()
    while words:
        line = ''
        while words and font.getbbox(line + words[0])[2] <= max_width:
            line += (words.pop(0) + ' ')
        lines.append(line)
    return lines

def create_news_image(template_path, news_image_url, headline_text, output_path='output.png'):
    template_image = Image.open(template_path).convert("RGBA")
    response = requests.get(news_image_url)
    
    if response.status_code == 200:
        try:
            news_image = Image.open(BytesIO(response.content)).convert("RGBA")
        except Exception as e:
            print(f"Error loading news image: {e}")
            return
    else:
        print(f"Error downloading image: HTTP {response.status_code}")
        return
    
    news_image = news_image.resize((template_image.width, template_image.height))
    final_image = Image.new('RGBA', template_image.size)
    final_image.paste(news_image, (0, 0))
    final_image.paste(template_image, (0, 0), template_image)
    draw = ImageDraw.Draw(final_image)
    font_path = '/System/Library/Fonts/Helvetica.ttc'
    font = ImageFont.truetype(font_path, 80, index=0)
    max_text_width = template_image.width - 100
    
    headline_text = headline_text.upper()
    wrapped_text = wrap_text(headline_text, font, max_text_width)
    text_y_position = 685
    text_color = (255, 255, 255)
    stroke_color = (0, 0, 0)
    stroke_width = 5
    
    for line in wrapped_text:
        draw.text((100, text_y_position), line, fill=text_color, font=font)
        text_y_position += font.getbbox(line)[3] + 10
    
    final_image = final_image.convert("RGB")
    final_image.save(output_path)
    print(output_path)

if __name__ == "__main__":
    if len(sys.argv) != 5:
        print("Usage: python image.py <template_path> <news_image_url> <headline_text> <output_path>")
        sys.exit(1)

    template_path = sys.argv[1]
    news_image_url = sys.argv[2]
    headline_text = sys.argv[3]
    output_path = sys.argv[4]
    create_news_image(template_path, news_image_url, headline_text, output_path)
