import praw
import pandas as pd
import os

# Setup Reddit API
reddit = praw.Reddit(
    client_id="eDUq_1TrhNQByRjCxMUdeQ",
    client_secret="spyNuTmVhw3N8uWQOYlqKBCL3dt0cA",
    user_agent="Decent_Guess9238",
    check_for_async=False # Necessary for Flask integration
)

def fetch_and_save_comments(post_url, file_path):
    # Fetch the submission
    submission = reddit.submission(url=post_url)

    # Store comment data
    comments_data = []

    # Fetch all comments
    submission.comments.replace_more(limit=None)

    for comment in submission.comments.list():
        comment_data = {
            "Comment ID": comment.id,
            "Comment Author": str(comment.author),
            "Comment Body": comment.body,
            "Upvotes": comment.score,
            "Created At": pd.to_datetime(comment.created_utc, unit='s'),
            "Parent ID": comment.parent_id,
            "Post URL": post_url
        }
        comments_data.append(comment_data)

    # Create DataFrame
    df_new = pd.DataFrame(comments_data)

    # Print count
    print(f"📝 {len(df_new)} comments scraped from: {post_url}")

    file_exists = os.path.exists(file_path)

    if file_exists:
        try:
            df_existing = pd.read_excel(file_path, sheet_name="Comments")
            df_combined = pd.concat([df_existing, df_new], ignore_index=True)
        except Exception as e:
            print("⚠️ Couldn't read existing file. Creating a new one. Error:", e)
            df_combined = df_new
    else:
        df_combined = df_new
        print(f"📁 File not found. Creating new file: {file_path}")

    # Save to Excel
    if file_exists:
        with pd.ExcelWriter(file_path, engine="openpyxl", mode="a", if_sheet_exists="replace") as writer:
            df_combined.to_excel(writer, sheet_name="Comments", index=False)
    else:
        with pd.ExcelWriter(file_path, engine="openpyxl", mode="w") as writer:
            df_combined.to_excel(writer, sheet_name="Comments", index=False)

    print(f"✅ Data saved to '{file_path}'\n")

# === USAGE ===
file_path = "reddit_comments_data_publichealth.xlsx"
new_post_url = "https://www.reddit.com/r/malaysia/comments/1cm48me/unpopular_opinion_government_clinic_is_better/"
fetch_and_save_comments(new_post_url, file_path)
