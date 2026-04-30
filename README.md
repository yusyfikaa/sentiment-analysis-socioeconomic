## Socioeconomic Sentiment Analysis from Social Media (TikTok & Reddit)

### Project Overview
This project analyzes social media discussions related to socioeconomic issues using Natural Language Processing (NLP) and Machine Learning techniques.  
The goal is to classify sentiments (positive, negative, neutral) and identify key topics influencing public opinion.

A web application is also developed to allow real-time sentiment prediction using a trained machine learning model.

### Objectives
- Scrape and collect social media data related to socioeconomic topics  
- Perform data cleaning and preprocessing  
- Conduct Exploratory Data Analysis (EDA) to identify sentiment patterns  
- Build and evaluate machine learning models for sentiment classification  
- Deploy a web application for real-time sentiment prediction  

### Tools & Technologies
- Python  
- Pandas, NumPy  
- Scikit-learn  
- NLTK / TextBlob (NLP processing)  
- Flask (Web Application)  
- HTML, CSS (Frontend)  
- Jupyter Notebook  

### Workflow

#### 1. Data Collection
- Social media data scraped using Python APIs / scraping scripts
- Stored in raw dataset format

#### 2. Data Preprocessing
- Removed duplicates and missing values
- Cleaned text (stopwords, punctuation, URLs)
- Tokenization and normalization

#### 3. Exploratory Data Analysis (EDA)
- Sentiment distribution analysis
- Word frequency analysis
- Visualization of key socioeconomic topics

#### 4. Machine Learning Model
- Trained classification models:
  - Logistic Regression
  - Naive Bayes
  - Support Vector Machine (SVM)
- Evaluated using accuracy, precision, recall, and F1-score

#### 5. Web Application
- Built using Flask
- Allows users to input text and get real-time sentiment prediction

### Web App Features
- Input text for sentiment prediction  
- Real-time classification output  
- Simple and user-friendly interface  

### Sample Output

- Web app interface
<img width="1889" height="1029" alt="image" src="https://github.com/user-attachments/assets/6024078a-bed3-44cd-b7f9-b92664930250" />

- EDA graphs
<img width="1899" height="1013" alt="image" src="https://github.com/user-attachments/assets/dbef79c5-8d56-4cab-8bd6-a00ad7464948" />

- Word clouds
<img width="1514" height="339" alt="image" src="https://github.com/user-attachments/assets/4cacb718-68e3-497d-a467-7c2621cb513a" />

- Text Analyser
<img width="1911" height="1021" alt="image" src="https://github.com/user-attachments/assets/c39e381c-953e-41e8-94e4-e4f08a7858fe" />

- Reddit Scraping Analyser
<img width="1901" height="1025" alt="image" src="https://github.com/user-attachments/assets/a6bf5cee-a367-46f4-a462-bc2af37bba85" />

### Model Evaluation Results

The trained sentiment classification model achieved strong performance across all sentiment classes:

* **Accuracy:** 93%
* **Macro F1-score:** 0.93

#### Class-wise Performance:

* Negative sentiment: F1-score = 0.90
* Neutral sentiment: F1-score = 0.96
* Positive sentiment: F1-score = 0.92

#### Key Observation:

The model performs best on neutral sentiment classification, while maintaining balanced performance across positive and negative classes. This indicates strong generalization ability on real-world social media data.
