import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { videoAPI } from '../services/api';
import toast from 'react-hot-toast';

const Home = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchVideos();
    fetchCategories();
  }, [selectedCategory, searchQuery]);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedCategory) params.category = selectedCategory;
      if (searchQuery) params.search = searchQuery;

      const response = await videoAPI.getVideos(params);
      setVideos(response.data.data.videos);
    } catch (error) {
      toast.error('Failed to load videos');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await videoAPI.getCategories();
      setCategories(response.data.data);
    } catch (error) {
      console.error('Failed to load categories');
    }
  };

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Browse Videos</h1>
        
        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <input
            type="text"
            placeholder="Search videos..."
            className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          
          <select
            className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
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

      {/* Videos Grid */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-xl">Loading videos...</div>
        </div>
      ) : videos.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-xl text-gray-400">No videos found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {videos.map((video) => (
            <Link
              key={video.id}
              to={`/video/${video.id}`}
              className="group cursor-pointer"
            >
              <div className="relative overflow-hidden rounded-lg bg-gray-800">
                <img
                  src={video.thumbnail_url || 'https://via.placeholder.com/320x180?text=No+Thumbnail'}
                  alt={video.title}
                  className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                
                {video.required_plan === 'premium' && (
                  <div className="absolute top-2 right-2 bg-yellow-600 text-xs font-bold px-2 py-1 rounded">
                    PREMIUM
                  </div>
                )}
                
                {video.duration && (
                  <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-xs px-2 py-1 rounded">
                    {formatDuration(video.duration)}
                  </div>
                )}
              </div>
              
              <div className="mt-2">
                <h3 className="font-semibold group-hover:text-red-500 transition-colors">
                  {video.title}
                </h3>
                <p className="text-sm text-gray-400 line-clamp-2">
                  {video.description}
                </p>
                <div className="flex items-center justify-between mt-1 text-xs text-gray-500">
                  <span>{video.category}</span>
                  <span>{video.view_count} views</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Home;
