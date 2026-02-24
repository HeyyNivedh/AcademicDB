"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import GridDistortion from "@/components/GridDistortion";

export default function Home() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    subject: "",
    file: null,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const [errorMSG, setErrorMSG] = useState("");

  const handleChange = (e) => {
    if (e.target.name === "file") {
      setFormData({ ...formData, file: e.target.files[0] });
    } else {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.file) {
      setErrorMSG("Please select a PDF file to upload.");
      return;
    }
    setIsLoading(true);
    setSuccessData(null);
    setErrorMSG("");

    try {
      const submitData = new FormData();
      submitData.append("subject", formData.subject);
      submitData.append("file", formData.file);

      const response = await fetch("http://127.0.0.1:8000/api/resources", {
        method: "POST",
        body: submitData, // The browser configures multipart/form-data
      });

      if (!response.ok) {
        throw new Error("Failed to upload resource. Please make sure the backend API is running.");
      }

      const data = await response.json();
      setSuccessData(data);
      setFormData({ subject: "", file: null });
      // Reset the file input visually
      const fileInput = document.getElementById("file");
      if (fileInput) fileInput.value = "";

    } catch (error) {
      setErrorMSG(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen font-sans flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* 3D Grid Distortion Background */}
      <div className="absolute inset-0 -z-10 bg-slate-950">
        <GridDistortion
          imageSrc="/bg.png"
          grid={15}
          mouse={0.1}
          strength={0.15}
          relaxation={0.9}
          className="opacity-40"
        />
      </div>

      <div className="w-full max-w-2xl z-10 mt-10">
        <div className="text-center mb-10">
          <h1 className="text-5xl font-extrabold tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 drop-shadow-lg">
            AcademiaDB
          </h1>
          <p className="text-slate-400 text-lg max-w-md mx-auto">
            Upload your study materials (PDF) and let AI instantly extract key topics and subjects, storing everything in the cloud securely.
          </p>
        </div>

        {/* Success Banner */}
        {successData && (
          <div className="mb-8 p-6 rounded-2xl bg-slate-800/80 backdrop-blur-md border border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.1)] flex flex-col animate-in fade-in duration-500">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 mr-4 shadow-inner">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-emerald-100">{successData.message}</h3>
                  <p className="text-slate-400 text-xs mt-1">Database ID: <span className="font-mono text-slate-300">{successData.document_id}</span></p>
                </div>
              </div>
              <button
                onClick={() => router.push('/library')}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Go to Library
              </button>
            </div>

            <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/50">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">AI Generated Tags</p>
              <div className="flex flex-wrap gap-2">
                {successData.generated_tags && successData.generated_tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium bg-gradient-to-r from-indigo-500/10 to-blue-500/10 border border-indigo-500/30 text-indigo-300 shadow-sm transition-all hover:scale-105 hover:bg-indigo-500/20 cursor-default"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Error Banner */}
        {errorMSG && (
          <div className="mb-8 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 backdrop-blur-md flex items-center">
            <svg className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {errorMSG}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="bg-slate-900/40 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 shadow-2xl relative"
        >
          <div className="space-y-6">
            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-slate-300 mb-2">
                Subject Category
              </label>
              <input
                type="text"
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                required
                placeholder="e.g. Computer Science, Mathematics"
                className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300"
              />
            </div>

            <div>
              <label htmlFor="file" className="block text-sm font-medium text-slate-300 mb-2">
                Upload Study Material (PDF)
              </label>
              <div className="flex items-center justify-center w-full">
                <label htmlFor="file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-700 border-dashed rounded-xl cursor-pointer bg-slate-950/50 hover:bg-slate-900/50 hover:border-indigo-500/50 transition-all duration-300">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <svg className="w-8 h-8 mb-3 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                    </svg>
                    <p className="mb-2 text-sm text-slate-400">
                      <span className="font-semibold text-indigo-400">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-slate-500">
                      {formData.file ? formData.file.name : "PDF documents only"}
                    </p>
                  </div>
                  <input
                    id="file"
                    name="file"
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={handleChange}
                  />
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-4 rounded-xl font-bold text-white shadow-lg focus:outline-none transition-all duration-300 transform group ${isLoading
                ? "bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700"
                : "bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:scale-[1.01] hover:shadow-[0_0_30px_rgba(79,70,229,0.3)] border border-transparent"
                }`}
            >
              <div className="flex items-center justify-center">
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Executing AI Analysis & Cloud Storage...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-3 group-hover:animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    Upload & Extract Tags
                  </>
                )}
              </div>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
