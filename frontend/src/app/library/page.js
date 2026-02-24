"use client";

import { useState, useEffect } from "react";
import GridDistortion from "@/components/GridDistortion";

export default function Library() {
    const [resources, setResources] = useState([]);
    const [filteredResources, setFilteredResources] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [subjects, setSubjects] = useState([]);
    const [activeSubject, setActiveSubject] = useState("All");
    const [isLoading, setIsLoading] = useState(true);

    const fetchResources = async () => {
        try {
            setIsLoading(true);
            const url = "http://127.0.0.1:8000/api/resources";
            const response = await fetch(url);
            if (response.ok) {
                const data = await response.json();
                setResources(data);

                // Extract unique subjects
                const uniqueSubjects = [...new Set(data.map(item => item.subject))].filter(Boolean).sort();
                setSubjects(["All", ...uniqueSubjects]);

                applyFilters(data, activeSubject, searchTerm);
            }
        } catch (error) {
            console.error("Failed to fetch resources:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchResources();
    }, []);

    const applyFilters = (data, subject, search) => {
        let filtered = data;

        if (subject && subject !== "All") {
            filtered = filtered.filter(item => item.subject === subject);
        }

        if (search && search.trim() !== "") {
            const q = search.toLowerCase();
            filtered = filtered.filter(item =>
                (item.title && item.title.toLowerCase().includes(q)) ||
                (item.tags && item.tags.some(tag => tag.toLowerCase().includes(q)))
            );
        }

        setFilteredResources(filtered);
    };

    const handleSubjectClick = (subject) => {
        setActiveSubject(subject);
        applyFilters(resources, subject, searchTerm);
    };

    const handleSearchChange = (e) => {
        const value = e.target.value;
        setSearchTerm(value);
        applyFilters(resources, activeSubject, value);
    };

    const handleDelete = async (resourceId) => {
        const isConfirmed = window.confirm("Are you sure you want to delete this document?");
        if (!isConfirmed) return;

        try {
            const response = await fetch(`http://127.0.0.1:8000/api/resources/${resourceId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                // Remove the resource from state
                const updatedResources = resources.filter(res => res._id !== resourceId);
                setResources(updatedResources);

                // Re-calculate unique subjects
                const uniqueSubjects = [...new Set(updatedResources.map(item => item.subject))].filter(Boolean).sort();
                setSubjects(["All", ...uniqueSubjects]);

                // Ensure active subject exists, fallback to All
                const newActiveSubject = uniqueSubjects.includes(activeSubject) ? activeSubject : "All";
                setActiveSubject(newActiveSubject);

                // Re-apply filters with updated array
                applyFilters(updatedResources, newActiveSubject, searchTerm);
            } else {
                alert("Failed to delete the resource. Please try again.");
            }
        } catch (error) {
            console.error("Failed to delete resource:", error);
            alert("An error occurred while deleting the resource.");
        }
    };

    return (
        <div className="min-h-screen p-6 md:p-12 max-w-7xl mx-auto flex flex-col md:flex-row gap-8 relative overflow-hidden">
            {/* 3D Grid Distortion Background */}
            <div className="fixed inset-0 -z-10 bg-slate-950">
                <GridDistortion
                    imageSrc="/bg.png"
                    grid={12}
                    mouse={0.1}
                    strength={0.10}
                    relaxation={0.9}
                    className="opacity-20"
                />
            </div>

            {/* Sidebar for Subjects */}
            <div className="w-full md:w-64 flex-shrink-0">
                <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-xl sticky top-24">
                    <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500 mb-6">
                        Subjects
                    </h3>
                    <ul className="space-y-2 flex flex-row md:flex-col overflow-x-auto md:overflow-visible pb-4 md:pb-0">
                        {subjects.map((sub, idx) => (
                            <li key={idx} className="flex-shrink-0">
                                <button
                                    onClick={() => handleSubjectClick(sub)}
                                    className={`w-full text-left px-4 py-2.5 rounded-lg transition-all duration-300 font-medium ${activeSubject === sub
                                        ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                                        : "text-slate-400 hover:bg-slate-800/80 hover:text-slate-200 border border-transparent"
                                        }`}
                                >
                                    {sub}
                                </button>
                            </li>
                        ))}
                        {subjects.length <= 1 && !isLoading && (
                            <p className="text-slate-500 text-sm italic">No subjects available.</p>
                        )}
                    </ul>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-grow">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                    <h2 className="text-4xl font-extrabold text-slate-100 tracking-tight">
                        {activeSubject === "All" ? "Resource Library" : `${activeSubject} Resources`}
                    </h2>

                    {/* Search Bar */}
                    <div className="relative w-full md:w-96">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <svg className="h-5 w-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <input
                            type="text"
                            placeholder="Search titles or tags..."
                            value={searchTerm}
                            onChange={handleSearchChange}
                            className="w-full bg-slate-900/60 border border-slate-700/50 rounded-xl pl-12 pr-4 py-3 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 shadow-inner"
                        />
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {filteredResources.map((resource) => (
                            <div
                                key={resource._id}
                                className="bg-slate-900/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-xl hover:shadow-[0_0_20px_rgba(79,70,229,0.15)] hover:border-indigo-500/30 transition-all duration-300 flex flex-col h-full group"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="text-lg font-bold text-slate-100 line-clamp-2 group-hover:text-blue-400 transition-colors" title={resource.title}>
                                        {resource.title}
                                    </h3>
                                    <span className="text-xs font-semibold px-2.5 py-1 bg-slate-800 text-slate-300 rounded-lg border border-slate-700 ml-3 flex-shrink-0">
                                        {resource.subject}
                                    </span>
                                </div>

                                <div className="mb-6 flex-grow flex items-center justify-between gap-2">
                                    {(resource.gridfs_file_id || resource.file_id) ? (
                                        <a
                                            href={`http://127.0.0.1:8000/api/files/${resource.gridfs_file_id || resource.file_id}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-300 bg-blue-500/10 border border-blue-500/20 rounded-lg hover:bg-blue-500/20 hover:text-blue-200 transition-colors shadow-sm"
                                        >
                                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                            View PDF inside GridFS
                                        </a>
                                    ) : (
                                        <span className="text-sm text-slate-500 italic">No GridFS PDF attached</span>
                                    )}

                                    <button
                                        onClick={() => handleDelete(resource._id)}
                                        className="inline-flex items-center px-3 py-2 text-sm font-medium text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg hover:bg-red-500/20 shadow-sm transition-colors"
                                        title="Delete Resource"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>

                                <div className="flex flex-wrap gap-2 mt-auto pt-4 border-t border-slate-800/50">
                                    {resource.tags && resource.tags.map((tag, idx) => (
                                        <span
                                            key={idx}
                                            className="text-xs font-semibold px-2.5 py-1 bg-slate-800/80 text-slate-400 rounded-md border border-slate-700/50"
                                        >
                                            #{tag}
                                        </span>
                                    ))}
                                    {(!resource.tags || resource.tags.length === 0) && (
                                        <span className="text-xs text-slate-600 italic">No tags</span>
                                    )}
                                </div>
                            </div>
                        ))}

                        {filteredResources.length === 0 && (
                            <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-800 rounded-2xl bg-slate-900/20">
                                <svg className="mx-auto h-16 w-16 text-slate-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                                <h3 className="text-lg font-bold text-slate-300 mb-1">No resources found</h3>
                                <p className="text-slate-500">Try adjusting your search or selecting a different subject.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
