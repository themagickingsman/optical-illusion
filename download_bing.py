import os
import requests
from bs4 import BeautifulSoup
import urllib.parse
import json
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
headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36"
}

for game, filename in games.items():
    print(f"Searching {game}...")
    query = urllib.parse.quote(f"{game} game cover art vertical")
    url = f"https://www.bing.com/images/search?q={query}&form=HDRSC2&first=1"
    
    try:
        res = requests.get(url, headers=headers, timeout=10)
        soup = BeautifulSoup(res.text, 'html.parser')
        a_tags = soup.find_all('a', class_='iusc')
        
        if a_tags:
            m_data = json.loads(a_tags[0].get('m', '{}'))
            img_url = m_data.get('murl')
            if not img_url and len(a_tags) > 1:
                m_data = json.loads(a_tags[1].get('m', '{}'))
                img_url = m_data.get('murl')
                
            if img_url:
                print(f"Downloading {img_url}")
                img_res = requests.get(img_url, headers=headers, timeout=10)
                if img_res.status_code == 200:
                    with open(os.path.join(output_dir, filename), 'wb') as f:
                        f.write(img_res.content)
                    print(f"Saved {filename}")
                else:
                    print(f"Failed to download image: {img_res.status_code}")
            else:
                print("No image URL found in metadata")
        else:
            print("No image tags found on Bing")
    except Exception as e:
        print(f"Error for {game}: {e}")
    sleep(2)

print("Done downloading.")
