import React, { useState, useEffect } from 'react';
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

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadVideos();
  }, [selectedCategory, searchTerm, pagination.currentPage]);

  const loadCategories = async () => {
    try {
      const response = await videoAPI.getCategories();
      setCategories(response.data.data);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const loadVideos = async () => {
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
  };

  const handleVideoClick = (videoId) => {
    navigate(`/video/${videoId}`);
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, currentPage: newPage }));
    window.scrollTo(0, 0);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Browse Videos</h1>
        <p className="text-gray-400">
          Discover and watch thousands of videos
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search videos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Category Filter */}
        <div className="w-full sm:w-48">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
          >
            <option value="">All Categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Loading State */}
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
        /* Empty State */
        <div className="text-center py-16">
          <svg
            className="mx-auto h-12 w-12 text-gray-500 mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
          <h3 className="text-xl font-semibold text-gray-400 mb-2">
            No videos found
          </h3>
          <p className="text-gray-500">
            Try adjusting your search or filters
          </p>
        </div>
      ) : (
        /* Video Grid */
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {videos.map((video) => (
              <div
                key={video.id}
                onClick={() => handleVideoClick(video.id)}
                className="cursor-pointer group"
              >
                {/* Thumbnail */}
                <div className="relative aspect-video bg-gray-800 rounded-lg overflow-hidden mb-3">
                  {video.thumbnail_url ? (
                    <img
                      src={video.thumbnail_url}
                      alt={video.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg
                        className="w-16 h-16 text-gray-600"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  )}
                  
                  {/* Duration Badge */}
                  {video.duration && (
                    <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 rounded text-xs">
                      {Math.floor(video.duration / 60)}:{String(video.duration % 60).padStart(2, '0')}
                    </div>
                  )}

                  {/* Premium Badge */}
                  {video.required_plan === 'premium' && (
                    <div className="absolute top-2 right-2 bg-yellow-500 text-black px-2 py-1 rounded text-xs font-bold">
                      PREMIUM
                    </div>
                  )}
                </div>

                {/* Video Info */}
                <h3 className="font-semibold mb-1 group-hover:text-blue-400 transition-colors line-clamp-2">
                  {video.title}
                </h3>
                
                <div className="flex items-center text-sm text-gray-400">
                  {video.category && (
                    <span className="mr-3">{video.category}</span>
                  )}
                  {video.view_count > 0 && (
                    <span className="flex items-center">
                      <svg
                        className="w-4 h-4 mr-1"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path
                          fillRule="evenodd"
                          d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {video.view_count}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="mt-8 flex justify-center items-center space-x-2">
              <button
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors"
              >
                Previous
              </button>
              
              <div className="flex items-center space-x-2">
                <span className="text-gray-400">
                  Page {pagination.currentPage} of {pagination.totalPages}
                </span>
              </div>
              
              <button
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage === pagination.totalPages}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors"
              >
                Next
              </button>
            </div>
          )}

          {/* Results Count */}
          <div className="mt-4 text-center text-sm text-gray-500">
            Showing {videos.length} of {pagination.totalCount} videos
          </div>
        </>
      )}
    </div>
  );
};

export default VideoList;
