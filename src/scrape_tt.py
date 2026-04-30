from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time
import pandas as pd
import os

# Setup Chrome
chrome_options = Options()
chrome_options.add_argument("--start-maximized")
chrome_options.add_argument('--disable-blink-features=AutomationControlled')

service = Service('./chromedriver.exe')
driver = webdriver.Chrome(service=service, options=chrome_options)

# Ask user for TikTok video links (comma separated)
video_urls = input("Paste TikTok video links (comma separated): ").split(",")
video_urls = [url.strip() for url in video_urls if url.strip()]

def scrape_video_stats(video_url):
    driver.get(video_url)
    time.sleep(5)  # wait for page to load

    print(f"Scraping stats for: {video_url}")

    stats = {"video_link": video_url, "likes": 0, "comments": 0, "shares": 0, "views": 0}

    try:
        # Wait until stat buttons load
        WebDriverWait(driver, 15).until(
            EC.presence_of_all_elements_located((By.XPATH, '//strong[@data-e2e]'))
        )

        # Scrape counts
        stats["likes"] = driver.find_element(By.XPATH, '//strong[@data-e2e="like-count"]').text
        stats["comments"] = driver.find_element(By.XPATH, '//strong[@data-e2e="comment-count"]').text
        stats["shares"] = driver.find_element(By.XPATH, '//strong[@data-e2e="share-count"]').text

        try:
            stats["views"] = driver.find_element(By.XPATH, '//strong[@data-e2e="view-count"]').text
        except:
            stats["views"] = "N/A"  # sometimes TikTok hides views

    except Exception as e:
        print("⚠️ Error scraping stats:", e)

    return stats

# Excel setup
file_name = 'tiktok_video_stats.xlsx'
if os.path.exists(file_name):
    df_existing = pd.read_excel(file_name)
else:
    df_existing = pd.DataFrame(columns=['video_link', 'likes', 'comments', 'shares', 'views'])

# Scrape each video
for url in video_urls:
    stats = scrape_video_stats(url)
    print(stats)

    df_existing = pd.concat([df_existing, pd.DataFrame([stats])], ignore_index=True)
    df_existing.to_excel(file_name, index=False)
    print(f"💾 Data saved to {file_name}")

driver.quit()
