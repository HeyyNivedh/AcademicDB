import os
from dotenv import load_dotenv
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure

import gridfs

# Load environment variables from .env file
load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")

def get_database_connection():
    """Connect to MongoDB and return the client."""
    try:
        # Create a connection using MongoClient
        client = MongoClient(MONGO_URI)
        
        # The ping command is cheap and does not require auth.
        client.admin.command('ping')
        print("Successfully connected to the MongoDB database!")
        return client
    except ConnectionFailure as e:
        print(f"Failed to connect to the MongoDB database. Error: {e}")
        return None

def get_gridfs(client):
    """Return a GridFS instance for the academiadb database."""
    if client is None:
        return None
    db = client['academiadb']
    return gridfs.GridFS(db)

def test_insert(client):
    """Insert a sample document into the academiadb.resources collection."""
    if client is None:
        return
    
    # Access the 'academiadb' database
    db = client['academiadb']
    
    # Access the 'resources' collection
    collection = db['resources']
    
    # Sample metadata document for an OS PDF
    sample_document = {
        "title": "Operating Systems Concepts",
        "type": "pdf",
        "subject": "Operating Systems",
        "uploader_id": "student_123",
        "tags": ["OS", "Memory Management", "Processes"]
    }
    
    # Insert the document
    result = collection.insert_one(sample_document)
    
    # Print the inserted document's ID
    print(f"Document inserted successfully. ID: {result.inserted_id}")

if __name__ == "__main__":
    client = get_database_connection()
    if client:
        test_insert(client)
        client.close()
