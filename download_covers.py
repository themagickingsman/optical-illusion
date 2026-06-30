import os
import requests
from duckduckgo_search import DDGS
from time import sleep

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

ddgs = DDGS()

for game, filename in games.items():
    print(f"Searching for {game}...")
    query = f"{game} game cover art vertical"
    try:
        results = list(ddgs.images(query, max_results=3))
        if results:
            image_url = results[0]['image']
            print(f"Downloading {image_url}...")
            response = requests.get(image_url, timeout=10)
            if response.status_code == 200:
                with open(os.path.join(output_dir, filename), 'wb') as f:
                    f.write(response.content)
                print(f"Saved {filename}")
            else:
                print(f"Failed to download {game}")
        else:
            print(f"No results for {game}")
    except Exception as e:
        print(f"Error for {game}: {e}")
    sleep(1.5)

