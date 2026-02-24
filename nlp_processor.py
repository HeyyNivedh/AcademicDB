import spacy
from collections import Counter

# Load English tokenizer, tagger, parser and NER
# We use a try-except to handle cases where the model isn't downloaded yet
try:
    nlp = spacy.load("en_core_web_sm")
except OSError:
    import spacy.cli
    spacy.cli.download("en_core_web_sm")
    nlp = spacy.load("en_core_web_sm")

def extract_keywords(text: str, top_n: int = 5) -> list:
    """
    Extracts the most relevant keywords/subjects from a given text.
    It uses NLP to filter out stop words and punctuation, focusing on nouns and proper nouns.
    """
    if not text:
        return []

    # Process the text with spaCy
    doc = nlp(text.lower())
    
    # Filter for nouns and proper nouns, ignoring stop words and punctuation
    keywords = [
        token.text for token in doc 
        if token.pos_ in ["NOUN", "PROPN"] and not token.is_stop and not token.is_punct
    ]
    
    # Count frequencies to find the most prominent topics
    freq = Counter(keywords)
    
    # Return the top N most frequent keywords
    return [word for word, count in freq.most_common(top_n)]

if __name__ == "__main__":
    # Quick test
    sample_text = (
        "Operating Systems (OS) manage computer hardware and software resources. "
        "Memory management is a crucial part of an OS. "
        "It handles processes, CPU scheduling, and file systems."
    )
    print("--- AcademiaDB NLP Tagging Test ---")
    print("Sample Text:", sample_text)
    print("Extracted Tags:", extract_keywords(sample_text))
