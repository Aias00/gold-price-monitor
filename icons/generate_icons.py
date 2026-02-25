from PIL import Image, ImageDraw, ImageFont
import os

sizes = [16, 48, 128]
color = "#FFD700"  # Gold color


def create_icon(size):
    # Create a simple icon: Gold background with a white 'G' or 'Au'
    img = Image.new("RGBA", (size, size), color)
    draw = ImageDraw.Draw(img)

    # Add a border or simple design
    border_color = "#B8860B"  # Dark Goldenrod
    draw.rectangle(
        [0, 0, size - 1, size - 1], outline=border_color, width=max(1, size // 16)
    )

    # Add text 'Au' if size is big enough
    if size >= 48:
        # Simple text drawing - might need a font path, but default is usually okay or none
        # Using built-in font logic is safer if fonts are missing
        try:
            # Try to load a font, or fallback to default
            try:
                font = ImageFont.truetype(
                    "/System/Library/Fonts/Arial.ttf", int(size * 0.5)
                )
            except:
                font = ImageFont.load_default()

            # Center the text
            text = "Au"
            # Get text size
            bbox = draw.textbbox((0, 0), text, font=font)
            text_width = bbox[2] - bbox[0]
            text_height = bbox[3] - bbox[1]
            x = (size - text_width) / 2
            y = (size - text_height) / 2

            draw.text((x, y), text, fill="white", font=font)
        except Exception as e:
            print(f"Text drawing failed: {e}")

    filename = f"icons/icon{size}.png"
    img.save(filename)
    print(f"Generated {filename}")


os.makedirs("icons", exist_ok=True)
for s in sizes:
    create_icon(s)
