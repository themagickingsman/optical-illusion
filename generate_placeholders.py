import os
from PIL import Image, ImageDraw, ImageFont
import random

games = {
    "Call of Duty: Black Ops 6": "black_ops_6.jpeg",
    "Balatro": "balatro.jpeg",
    "Destiny 2": "destiny_2.jpeg",
    "Zynga Poker": "zynga_poker.jpeg",
    "World of Warcraft": "wow.jpeg",
    "EA Sports College Football 25": "cfb_25.jpeg",
    "Angry Birds": "angry_birds.jpeg",
    "Block Blast!": "block_blast.jpeg",
    "Poker Stars": "poker_stars.jpeg",
    "Tennis Clash": "tennis_clash.jpeg",
    "Brawlstars": "brawlstars.jpeg",
    "Zooba": "zooba.jpeg"
}

output_dir = "public/assets/box_art"
os.makedirs(output_dir, exist_ok=True)

width, height = 400, 600

# Nice gradient or solid colors for games
colors = [
    (40, 44, 52), (220, 20, 60), (30, 144, 255), (255, 140, 0),
    (0, 128, 128), (128, 0, 128), (0, 100, 0), (70, 130, 180)
]

for i, (game_name, filename) in enumerate(games.items()):
    bg_color = colors[i % len(colors)]
    img = Image.new('RGB', (width, height), color=bg_color)
    d = ImageDraw.Draw(img)
    
    # We won't have custom fonts easily, so we use default
    # But let's try to center the text manually by drawing each word if needed
    text_color = (255, 255, 255)
    
    # Just a simple draw
    # Split text if too long
    words = game_name.split()
    y_text = height / 2 - 50
    for word in words:
        d.text((50, y_text), word, fill=text_color)
        y_text += 20
        
    img.save(os.path.join(output_dir, filename), quality=90)
    print(f"Generated {filename}")

