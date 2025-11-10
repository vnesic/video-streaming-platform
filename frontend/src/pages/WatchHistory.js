import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { videoAPI } from '../services/api';
import toast from 'react-hot-toast';

const WatchHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWatchHistory();
  }, []);

  const fetchWatchHistory = async () => {
    try {
      const response = await videoAPI.getWatchHistory();
      setHistory(response.data.data);
      setLoading(false);
    } catch (error) {
      toast.error('Failed to load watch history');
      setLoading(false);
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

  const calculateProgress = (current, total) => {
    if (!total) return 0;
    return Math.round((current / total) * 100);
  };

  const formatLastWatched = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold mb-8">Continue Watching</h1>

      {history.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-xl text-gray-400 mb-6">No watch history yet</p>
          <Link
            to="/"
            className="inline-block px-6 py-3 bg-red-600 hover:bg-red-700 rounded-md font-semibold transition-colors"
          >
            Start Watching
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((item) => (
            <Link
              key={item.id}
              to={`/video/${item.id}`}
              className="flex bg-gray-800 rounded-lg overflow-hidden hover:bg-gray-750 transition-colors"
            >
              <div className="relative w-64 flex-shrink-0">
                <img
                  src={item.thumbnail_url || 'https://via.placeholder.com/320x180?text=No+Thumbnail'}
                  alt={item.title}
                  className="w-full h-36 object-cover"
                />
                
                {/* Progress Bar */}
                {!item.completed && item.progress > 0 && item.duration && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-600">
                    <div
                      className="h-full bg-red-600"
                      style={{ width: `${calculateProgress(item.progress, item.duration)}%` }}
                    />
                  </div>
                )}
                
                {item.completed && (
                  <div className="absolute top-2 left-2 bg-green-600 text-xs font-bold px-2 py-1 rounded">
                    COMPLETED
                  </div>
                )}
              </div>

              <div className="flex-1 p-4 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-semibold mb-1">{item.title}</h3>
                  <p className="text-sm text-gray-400 line-clamp-2">
                    {item.description}
                  </p>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-400">
                  <div className="flex items-center space-x-4">
                    {!item.completed && item.duration && (
                      <span>
                        {calculateProgress(item.progress, item.duration)}% watched
                      </span>
                    )}
                    {item.duration && (
                      <span>{formatDuration(item.duration)}</span>
                    )}
                  </div>
                  <span>Last watched {formatLastWatched(item.last_watched_at)}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default WatchHistory;
