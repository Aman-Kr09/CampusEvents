import sys
import json
import re
from sklearn.feature_extraction.text import TfidfVectorizer

def main():
    try:
        # Read text from stdin
        description = sys.stdin.read().strip()
        
        if not description or len(description) < 10:
            print(json.dumps([]))
            return

        # Preprocess text slightly: remove non-alphabetic characters (except spaces)
        cleaned_text = re.sub(r'[^a-zA-Z\s]', '', description)
        
        # We need a small dummy corpus to calculate TF-IDF. 
        # We will split the description into sentences and add a few general technical terms 
        # as dummy reference documents to penalize overly common generic words.
        sentences = [s.strip() for s in cleaned_text.split('\n') if len(s.strip()) > 5]
        if len(sentences) < 2:
            # Fallback to simple words split if there aren't enough sentences
            sentences = [cleaned_text]
            
        # Add basic dummy context corpus to balance TF-IDF weights
        dummy_corpus = [
            "the student will join the campus and attend class university education",
            "event workshop session meeting seminar conference college school academic",
            "registration registration link register free online offline ticket entry cost fee"
        ]
        
        corpus = sentences + dummy_corpus

        # Run TF-IDF Vectorizer
        vectorizer = TfidfVectorizer(stop_words='english', min_df=1)
        tfidf_matrix = vectorizer.fit_transform(corpus)
        
        # Sum tf-idf scores for each term across our target document sentences
        feature_names = vectorizer.get_feature_names_out()
        
        # We only care about the indices corresponding to actual input sentences (not the dummy corpus)
        target_matrix = tfidf_matrix[:len(sentences)]
        scores = target_matrix.sum(axis=0).A1
        
        # Map words to their scores
        word_scores = []
        for i, word in enumerate(feature_names):
            # Exclude very short words and common junk terms
            if len(word) > 3 and word not in ["event", "workshop", "college", "campus", "student", "students"]:
                word_scores.append((word.capitalize(), float(scores[i])))

        # Sort words by score descending
        word_scores.sort(key=lambda x: x[1], reverse=True)
        
        # Extract the top 4 tags
        top_tags = [w[0] for w in word_scores[:4]]
        
        print(json.dumps(top_tags))

    except Exception as e:
        sys.stderr.write(f"Tag Generator Error: {str(e)}\n")
        # Fail-safe: extract basic long words from the description
        try:
            words = re.findall(r'[a-zA-Z]{5,}', description)
            unique_words = list(dict.fromkeys(words))[:3]
            capitalized = [w.capitalize() for w in unique_words]
            print(json.dumps(capitalized))
        except:
            print(json.dumps([]))
        sys.exit(0)

if __name__ == '__main__':
    main()
