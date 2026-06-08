import sys
import json
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

def main():
    try:
        # Read JSON from stdin
        input_data = json.loads(sys.stdin.read())
        user_interests = input_data.get('interests', [])
        events = input_data.get('events', [])

        if not events:
            print(json.dumps([]))
            return

        if not user_interests:
            # Return original order if student didn't pick interests
            print(json.dumps([e['_id'] for e in events]))
            return

        # Prepare text representation for each event
        corpus = []
        for e in events:
            # Mix the metadata with weight: repeat title and category for more significance
            name = e.get('name', '')
            desc = e.get('description', '')
            cat = e.get('category', '')
            tags = ' '.join(e.get('tags', []))
            
            combined_text = f"{name} {name} {desc} {cat} {cat} {tags}"
            corpus.append(combined_text)

        # Fit TF-IDF Vectorizer
        vectorizer = TfidfVectorizer(stop_words='english')
        tfidf_matrix = vectorizer.fit_transform(corpus)

        # Create user interest vector
        user_text = ' '.join(user_interests)
        user_vector = vectorizer.transform([user_text])

        # Compute cosine similarity
        similarities = cosine_similarity(user_vector, tfidf_matrix).flatten()

        # Sort indices by similarity score descending
        ranked_indices = np.argsort(similarities)[::-1]

        # Extract ranked IDs
        ranked_ids = [events[idx]['_id'] for idx in ranked_indices]
        print(json.dumps(ranked_ids))

    except Exception as e:
        sys.stderr.write(f"Recommendation Error: {str(e)}\n")
        # In case of python library missing or errors, return the raw event list in default database order
        try:
            raw_ids = [e['_id'] for e in events]
            print(json.dumps(raw_ids))
        except:
            print(json.dumps([]))
        sys.exit(0) # Exit cleanly to prevent node process crash

if __name__ == '__main__':
    main()
