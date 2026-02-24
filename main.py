import io
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import PyPDF2
from nlp_processor import extract_keywords
from database import get_database_connection, get_gridfs
from bson import ObjectId

app = FastAPI(title="AcademiaDB API", description="Intelligent Academic Resource API")

# Configure CORS for decoupled frontend (React/Next.js)
origins = [
    "http://localhost:5173",  # Vite default port
    "http://localhost:3000",  # React/Next.js default port
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Connect to MongoDB
client = get_database_connection()
if client is None:
    print("WARNING: Could not connect to MongoDB. API calls will fail.")
    fs = None
else:
    db = client['academiadb']
    resources_collection = db['resources']
    fs = get_gridfs(client)

# Define a Pydantic model for incoming POST requests
class ResourceInput(BaseModel):
    title: str
    subject: str
    text_content: str
    uploader_id: str = "anonymous_student"

@app.get("/")
def read_root():
    return {"message": "Welcome to the AcademiaDB API!"}

@app.post("/api/resources")
async def upload_resource(
    subject: str = Form(...),
    file: UploadFile = File(...)
):
    """
    Accepts resource metadata and a PDF file.
    Saves the PDF to GridFS, extracts text, generates tags, and saves to MongoDB.
    """
    if client is None or fs is None:
        raise HTTPException(status_code=500, detail="Database connection is unavailable")

    try:
        # Read the file data
        file_data = await file.read()

        # Save the actual PDF file directly into MongoDB using GridFS
        file_id = fs.put(file_data, filename=file.filename, content_type=file.content_type)

        # Extract text from PDF using an in-memory byte stream
        text_content = ""
        try:
            reader = PyPDF2.PdfReader(io.BytesIO(file_data))
            for page in reader.pages:
                text_content += page.extract_text() + " "
        except Exception as e:
            print(f"Error extracting text from PDF: {e}")

        # Step 1: Use NLP Processor to extract tags from the extracted text content
        generated_tags = extract_keywords(text_content)

        # Step 2: Prepare the document for MongoDB insertion
        document = {
            "title": file.filename, # Use filename as the title
            "subject": subject,
            "gridfs_file_id": str(file_id),
            "tags": generated_tags,
            "uploader_id": "anonymous_student",
            "type": "pdf" 
        }

        # Step 3: Insert into MongoDB
        result = resources_collection.insert_one(document)

        # Step 4: Return success to the user
        return {
            "message": "Resource successfully analyzed and uploaded.",
            "document_id": str(result.inserted_id),
            "generated_tags": generated_tags,
            "file_id": str(file_id)
        }
    except Exception as e:
         raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/files/{file_id}")
def get_file(file_id: str):
    """
    Retrieves a physical PDF file directly from MongoDB GridFS and streams it.
    """
    if fs is None:
        raise HTTPException(status_code=500, detail="Database connection is unavailable")
        
    try:
        # Retrieve the file from GridFS using its ObjectId
        grid_out = fs.get(ObjectId(file_id))
        
        # Return the file as a streaming response so the browser can display it
        return StreamingResponse(
            io.BytesIO(grid_out.read()), 
            media_type=grid_out.content_type,
            headers={"Content-Disposition": f'inline; filename="{grid_out.filename}"'}
        )
    except Exception as e:
        raise HTTPException(status_code=404, detail="File not found in GridFS")

@app.get("/api/resources")
def get_resources():
    """
    Fetches all resources from the MongoDB Atlas collection.
    Converts the internal ObjectId to a string before returning.
    """
    if client is None:
        raise HTTPException(status_code=500, detail="Database connection is unavailable")

    try:
        # Fetch all documents, sorting by newest first (descending order of _id)
        # In a real app we might paginate or sort by a date field
        cursor = resources_collection.find().sort("_id", -1)
        
        resources = []
        for document in cursor:
            # Convert ObjectId to string for JSON serialization
            document["_id"] = str(document["_id"])
            resources.append(document)
            
        return resources
    except Exception as e:
         raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/search")
def search_resources(q: str = ""):
    """
    Searches for resources by title, subject, or tags.
    """
    if client is None:
        raise HTTPException(status_code=500, detail="Database connection is unavailable")

    try:
        if not q or q.strip() == "":
            return get_resources()
            
        # Case-insensitive regex search
        regex = {"$regex": q, "$options": "i"}
        query = {
            "$or": [
                {"title": regex},
                {"subject": regex},
                {"tags": regex}
            ]
        }
        
        cursor = resources_collection.find(query).sort("_id", -1)
        
        resources = []
        for document in cursor:
            document["_id"] = str(document["_id"])
            resources.append(document)
            
        return resources
    except Exception as e:
         raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/resources/{resource_id}")
async def delete_resource(resource_id: str):
    """
    Deletes a resource by its ID, including its associated file in GridFS.
    """
    if client is None or fs is None:
        raise HTTPException(status_code=500, detail="Database connection is unavailable")

    try:
        # 1. Find the metadata document
        document = resources_collection.find_one({"_id": ObjectId(resource_id)})
        if not document:
             raise HTTPException(status_code=404, detail="Resource not found")
        
        # 2. Check for missing legacy files & delete physical file from GridFS
        file_id = document.get("gridfs_file_id") or document.get("file_id")
        
        # Only try deleting from GridFS if an explicit ID was tied to this model
        if file_id and file_id.strip() and file_id != "None":
             try:
                 fs.delete(ObjectId(file_id))
             except Exception as e:
                 print(f"Warning: Could not delete GridFS file: {e}")
                 
        # 3. Delete the metadata document
        resources_collection.delete_one({"_id": ObjectId(resource_id)})
        
        return {"message": "Resource successfully deleted"}
    except Exception as e:
         raise HTTPException(status_code=500, detail=str(e))
