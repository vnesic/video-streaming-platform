import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import VideoPlayer from './VideoPlayer';
import { videoAPI } from '../services/api';
import toast from 'react-hot-toast';

const VideoPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [relatedVideos, setRelatedVideos] = useState([]);

  useEffect(() => {
    loadVideo();
  }, [id]);

  const loadVideo = async () => {
    try {
      setLoading(true);
      
      // Get video details
      const videoResponse = await videoAPI.getVideo(id);
      setVideo(videoResponse.data.data);
      
      // Load related videos
      if (videoResponse.data.data.category) {
        const relatedResponse = await videoAPI.getVideos({
          category: videoResponse.data.data.category,
          limit: 4
        });
        
        // Filter out current video
        const filtered = relatedResponse.data.data.videos.filter(v => v.id !== id);
        setRelatedVideos(filtered);
      }
    } catch (error) {
      console.error('Failed to load video:', error);
      toast.error('Video not found');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="bg-gray-800 aspect-video rounded-lg mb-6"></div>
          <div className="bg-gray-800 h-8 rounded mb-4 w-3/4"></div>
          <div className="bg-gray-800 h-4 rounded mb-2 w-full"></div>
          <div className="bg-gray-800 h-4 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Video Not Found</h2>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {/* Video Player */}
          <VideoPlayer
            videoId={id}
            onBack={() => navigate('/')}
          />

          {/* Video Details */}
          <div className="mt-6">
            {/* Description */}
            {video.description && (
              <div className="bg-gray-800 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold mb-3">Description</h3>
                <p className="text-gray-300 whitespace-pre-line">
                  {video.description}
                </p>
              </div>
            )}

            {/* Video Info */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Video Information</h3>
              <div className="grid grid-cols-2 gap-4">
                {video.category && (
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Category</p>
                    <p className="font-medium">{video.category}</p>
                  </div>
                )}
                
                {video.duration && (
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Duration</p>
                    <p className="font-medium">
                      {Math.floor(video.duration / 60)} min {video.duration % 60} sec
                    </p>
                  </div>
                )}
                
                <div>
                  <p className="text-sm text-gray-400 mb-1">Views</p>
                  <p className="font-medium">{video.view_count || 0}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-400 mb-1">Plan Required</p>
                  <p className="font-medium capitalize">
                    {video.required_plan || 'Free'}
                  </p>
                </div>
                
                {video.created_at && (
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Published</p>
                    <p className="font-medium">
                      {new Date(video.created_at).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar - Related Videos */}
        <div className="lg:col-span-1">
          <div className="bg-gray-800 rounded-lg p-6 sticky top-4">
            <h3 className="text-lg font-semibold mb-4">Related Videos</h3>
            
            {relatedVideos.length === 0 ? (
              <p className="text-gray-400 text-sm">No related videos found</p>
            ) : (
              <div className="space-y-4">
                {relatedVideos.map((relatedVideo) => (
                  <div
                    key={relatedVideo.id}
                    onClick={() => navigate(`/video/${relatedVideo.id}`)}
                    className="flex gap-3 cursor-pointer group"
                  >
                    {/* Thumbnail */}
                    <div className="flex-shrink-0 w-32 aspect-video bg-gray-700 rounded overflow-hidden">
                      {relatedVideo.thumbnail_url ? (
                        <img
                          src={relatedVideo.thumbnail_url}
                          alt={relatedVideo.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <svg
                            className="w-8 h-8 text-gray-600"
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
                      
                      {relatedVideo.duration && (
                        <div className="absolute bottom-1 right-1 bg-black/80 px-1 py-0.5 rounded text-xs">
                          {Math.floor(relatedVideo.duration / 60)}:{String(relatedVideo.duration % 60).padStart(2, '0')}
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm mb-1 line-clamp-2 group-hover:text-blue-400 transition-colors">
                        {relatedVideo.title}
                      </h4>
                      <div className="flex items-center text-xs text-gray-400">
                        {relatedVideo.view_count > 0 && (
                          <span className="flex items-center">
                            <svg
                              className="w-3 h-3 mr-1"
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
                            {relatedVideo.view_count}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPage;
