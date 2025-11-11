// src/pages/VideoList.js
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { videoAPI } from '../services/api';
import toast from 'react-hot-toast';

const VideoList = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    limit: 20
  });
  const navigate = useNavigate();

  const loadCategories = useCallback(async () => {
    try {
      const response = await videoAPI.getCategories();
      setCategories(response.data.data);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  }, []);

  const loadVideos = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.currentPage,
        limit: pagination.limit
      };
      if (selectedCategory) params.category = selectedCategory;
      if (searchTerm) params.search = searchTerm;
      const response = await videoAPI.getVideos(params);
      setVideos(response.data.data.videos);
      setPagination(response.data.data.pagination);
    } catch (error) {
      console.error('Failed to load videos:', error);
      toast.error('Failed to load videos');
    } finally {
      setLoading(false);
    }
  }, [pagination.currentPage, pagination.limit, searchTerm, selectedCategory]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    loadVideos();
  }, [loadVideos]);

  const handleVideoClick = (videoId) => navigate(`/video/${videoId}`);

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, currentPage: newPage }));
    window.scrollTo(0, 0);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Browse Videos</h1>
        <p className="text-gray-400">Discover and watch thousands of videos</p>
      </div>
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search videos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
          />
        </div>
        <div className="w-full sm:w-48">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-800 aspect-video rounded-lg mb-3"></div>
              <div className="bg-gray-800 h-4 rounded mb-2"></div>
              <div className="bg-gray-800 h-3 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      ) : videos.length === 0 ? (
        <div className="text-center py-16 text-gray-400">No videos found</div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {videos.map(v => (
              <div key={v.id} onClick={() => handleVideoClick(v.id)} className="cursor-pointer group">
                <div className="relative aspect-video bg-gray-800 rounded-lg overflow-hidden mb-3">
                  {v.thumbnail_url && (
                    <img src={v.thumbnail_url} alt={v.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
                  )}
                  {v.duration && (
                    <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 rounded text-xs">
                      {Math.floor(v.duration / 60)}:{String(v.duration % 60).padStart(2, '0')}
                    </div>
                  )}
                </div>
                <h3 className="font-semibold mb-1 group-hover:text-blue-400 transition-colors line-clamp-2">{v.title}</h3>
              </div>
            ))}
          </div>
          {pagination.totalPages > 1 && (
            <div className="mt-8 flex justify-center items-center space-x-2">
              <button onClick={() => handlePageChange(pagination.currentPage - 1)} disabled={pagination.currentPage === 1} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 rounded-md">Previous</button>
              <span className="text-gray-400">Page {pagination.currentPage} of {pagination.totalPages}</span>
              <button onClick={() => handlePageChange(pagination.currentPage + 1)} disabled={pagination.currentPage === pagination.totalPages} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 rounded-md">Next</button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default VideoList;
