from flask import Flask, render_template, jsonify, request
import pandas as pd
import pickle
import praw # Import the Reddit API wrapper
from datetime import datetime

# Initialize the Flask application
app = Flask(__name__)

# --- Reddit API Credentials ---
# IMPORTANT: Replace these with your own Reddit API credentials
# Do NOT share your client_secret with anyone.
reddit = praw.Reddit(
    client_id="eDUq_1TrhNQByRjCxMUdeQ",
    client_secret="spyNuTmVhw3N8uWQOYlqKBCL3dt0cA",
    user_agent="Decent_Guess9238",
    check_for_async=False # Necessary for Flask integration
)


# --- Load Data and Model ---
# Load the dataset from the specified Excel file
try:
    df = pd.read_excel('data/dataset.xlsx')
    # Standardize the 'Sentiment' column more robustly
    if 'Sentiment' in df.columns:
        df['Sentiment'] = df['Sentiment'].astype(str).str.strip().str.title()
    else:
        print("Warning: 'Sentiment' column not found in the dataset.")
    
    # Ensure 'clean_comment' and 'comment' columns are always string type
    if 'clean_comment' in df.columns:
        df['clean_comment'] = df['clean_comment'].astype(str)
    else:
        print("Warning: 'clean_comment' column not found in the dataset.")
        
    if 'comment' in df.columns:
        df['comment'] = df['comment'].astype(str)
    else:
        print("Warning: 'comment' column not found in the dataset.")


except FileNotFoundError:
    print("Error: 'data/dataset.xlsx' not found. Please ensure the file is in the correct directory.")
    df = pd.DataFrame() # Create an empty DataFrame to avoid further errors

# Load the pre-trained sentiment analysis model
try:
    with open('sentiment_analyzer_pipeline.pkl', 'rb') as f:
        sentiment_pipeline = pickle.load(f)
except FileNotFoundError:
    print("Error: 'sentiment_analyzer_pipeline.pkl' not found. The analyser page will not work.")
    sentiment_pipeline = None

# --- Route Definitions ---

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/home')
def home():
    return render_template('home.html')

@app.route('/dashboard')
def dashboard():
    return render_template('dashboard.html')

@app.route('/visualization/employment')
def visualisation_employment():
    return render_template('visualisation_employment.html')

@app.route('/visualization/living_cost')
def visualisation_living_cost():
    return render_template('visualisation_living_cost.html')

@app.route('/visualization/public_health')
def visualisation_public_health():
    return render_template('visualisation_public_health.html')

@app.route('/view_data')
def view_data():
    return render_template('view_data.html')

@app.route('/analyser')
def analyser():
    return render_template('analyser.html')

@app.route('/real_time_scrape')
def real_time_scrape():
    return render_template('real_time_scrape.html')

@app.route('/help')
def help_page():
    return render_template('help.html')

# --- API Endpoints for Chart Data ---

@app.route('/api/dashboard_data')
def dashboard_data():
    if df.empty:
        return jsonify({})

    counts = df['Sentiment'].value_counts()
    sentiment_counts = {
        'Positive': int(counts.get('Positive', 0)),
        'Neutral': int(counts.get('Neutral', 0)),
        'Negative': int(counts.get('Negative', 0))
    }
    
    total_count = int(df.shape[0])

    topic_dist = df.groupby('socio_topic')['Sentiment'].value_counts().unstack().fillna(0).to_dict('index')
    
    platform_dist = df.groupby('platform')['Sentiment'].value_counts().unstack().fillna(0).to_dict('index')

    wordcloud_data = {
        'Employment Trend': ' '.join(df[df['socio_topic'] == 'Employment Trend']['clean_comment'].astype(str)),
        'Cost of Living': ' '.join(df[df['socio_topic'] == 'Cost of Living']['clean_comment'].astype(str)),
        'Public Health': ' '.join(df[df['socio_topic'] == 'Public Health']['clean_comment'].astype(str)),
    }

    return jsonify({
        'sentiment_counts': sentiment_counts,
        'total_count': total_count,
        'platform_dist': platform_dist,
        'topic_dist': topic_dist,
        'wordcloud_data': wordcloud_data
    })

@app.route('/api/topic_data/<topic>')
def topic_data(topic):
    if df.empty:
        return jsonify({})
        
    topic_map = {
        'employment': 'Employment Trend',
        'living_cost': 'Cost of Living',
        'public_health': 'Public Health'
    }
    
    topic_name = topic_map.get(topic)
    if not topic_name:
        return jsonify({'error': 'Invalid topic'}), 404

    topic_df = df[df['socio_topic'] == topic_name]
    
    counts = topic_df['Sentiment'].value_counts()
    sentiment_counts = {
        'Positive': int(counts.get('Positive', 0)),
        'Neutral': int(counts.get('Neutral', 0)),
        'Negative': int(counts.get('Negative', 0))
    }
    
    total_count = int(topic_df.shape[0])
    platform_dist = topic_df.groupby('platform')['Sentiment'].value_counts().unstack().fillna(0).to_dict('index')

    positive_words = ' '.join(topic_df[topic_df['Sentiment'] == 'Positive']['clean_comment'].astype(str))
    neutral_words = ' '.join(topic_df[topic_df['Sentiment'] == 'Neutral']['clean_comment'].astype(str))
    negative_words = ' '.join(topic_df[topic_df['Sentiment'] == 'Negative']['clean_comment'].astype(str))

    return jsonify({
        'sentiment_counts': sentiment_counts,
        'total_count': total_count,
        'platform_dist': platform_dist,
        'word_clouds': {
            'positive': positive_words,
            'neutral': neutral_words,
            'negative': negative_words
        }
    })

@app.route('/api/get_all_data')
def get_all_data():
    if df.empty:
        return jsonify([])
    data_dict = df[['date_posted', 'comment', 'socio_topic', 'Sentiment']].to_dict(orient='records')
    for item in data_dict:
        if pd.notna(item['date_posted']):
            item['date_posted'] = item['date_posted'].strftime('%Y-%m-%d, %I:%M %p')
        else:
            item['date_posted'] = 'N/A'
    return jsonify(data_dict)

@app.route('/api/analyze_text', methods=['POST'])
def analyze_text():
    if not sentiment_pipeline:
        return jsonify({'error': 'Sentiment model not loaded'}), 500
        
    data = request.get_json()
    text = data.get('text', '')
    if not text:
        return jsonify({'error': 'No text provided'}), 400

    prediction = sentiment_pipeline.predict([text])[0]
    probabilities = sentiment_pipeline.predict_proba([text])[0]
    confidence = max(probabilities)
    
    return jsonify({
        'sentiment': str(prediction).title(),
        'confidence_score': f"{confidence:.2%}"
    })

# --- Endpoint for Live Reddit Scraping ---
@app.route('/api/scrape_and_analyze', methods=['POST'])
def scrape_and_analyze():
    if not sentiment_pipeline:
        return jsonify({'error': 'Sentiment model not loaded'}), 500

    data = request.get_json()
    url = data.get('link', '')

    if not url:
        return jsonify({'error': 'No URL provided'}), 400

    try:
        submission = reddit.submission(url=url)
        submission.comments.replace_more(limit=0) # Get top-level comments
        
        table_data = []
        sentiments = []
        for i, top_level_comment in enumerate(submission.comments.list()):
            if i >= 50: # Limit to 50 comments to keep it fast
                break
            
            comment_text = top_level_comment.body
            author = top_level_comment.author.name if top_level_comment.author else '[deleted]'
            
            # Analyze the comment with your model
            prediction = str(sentiment_pipeline.predict([comment_text])[0]).title()
            probabilities = sentiment_pipeline.predict_proba([comment_text])[0]
            confidence = max(probabilities)
            sentiments.append(prediction)
            
            table_data.append({
                'comment': comment_text,
                'author': author,
                'sentiment': prediction,
                'score': f"{confidence:.2%}"
            })
            
        # Calculate summary statistics
        sentiment_series = pd.Series(sentiments)
        counts = sentiment_series.value_counts()
        summary = {
            'sentiment_counts': {
                'Positive': int(counts.get('Positive', 0)),
                'Neutral': int(counts.get('Neutral', 0)),
                'Negative': int(counts.get('Negative', 0))
            },
            'total_count': len(table_data)
        }
            
        return jsonify({'summary': summary, 'table_data': table_data})

    except Exception as e:
        print(f"Error scraping Reddit: {e}")
        return jsonify({'error': 'Could not scrape the provided Reddit URL. Please check the link and try again.'}), 500


if __name__ == '__main__':
    app.run(debug=True)
