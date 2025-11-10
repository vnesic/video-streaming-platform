import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { videoAPI } from '../services/api';
import toast from 'react-hot-toast';
import ReactPlayer from 'react-player';

const VideoPlayer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [video, setVideo] = useState(null);
  const [playbackUrl, setPlaybackUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  const playerRef = useRef(null);

  useEffect(() => {
    fetchVideoDetails();
  }, [id]);

  const fetchVideoDetails = async () => {
    try {
      setLoading(true);
      
      // Get video details
      const videoResponse = await videoAPI.getVideoById(id);
      setVideo(videoResponse.data.data);

      // Get playback URL
      const playbackResponse = await videoAPI.getPlaybackUrl(id);
      setPlaybackUrl(playbackResponse.data.data.playbackUrl);
      
      setLoading(false);
    } catch (error) {
      const errorData = error.response?.data;
      
      if (errorData?.code === 'NO_SUBSCRIPTION') {
        toast.error('Please subscribe to watch videos');
        navigate('/subscription');
      } else if (errorData?.code === 'INSUFFICIENT_PLAN') {
        toast.error(`This video requires a ${errorData.requiredPlan} subscription`);
        navigate('/subscription');
      } else {
        setError('Failed to load video');
        toast.error('Failed to load video');
      }
      
      setLoading(false);
    }
  };

  const handleProgress = (state) => {
    setProgress(state.playedSeconds);
  };

  const handlePause = async () => {
    try {
      await videoAPI.updateProgress(id, Math.floor(progress), false);
    } catch (error) {
      console.error('Failed to save progress');
    }
  };

  const handleEnded = async () => {
    try {
      await videoAPI.updateProgress(id, Math.floor(progress), true);
      toast.success('Video completed!');
    } catch (error) {
      console.error('Failed to save completion');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl">Loading video...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="text-xl text-red-500 mb-4">{error}</div>
        <Link to="/" className="text-red-600 hover:text-red-500">
          Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Video Player */}
      <div className="bg-black rounded-lg overflow-hidden mb-6">
        <ReactPlayer
          ref={playerRef}
          url={playbackUrl}
          controls
          width="100%"
          height="600px"
          playing
          onProgress={handleProgress}
          onPause={handlePause}
          onEnded={handleEnded}
          config={{
            file: {
              attributes: {
                controlsList: 'nodownload'
              }
            }
          }}
        />
      </div>

      {/* Video Info */}
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">{video?.title}</h1>
            <div className="flex items-center space-x-4 text-sm text-gray-400">
              <span>{video?.category}</span>
              <span>•</span>
              <span>{video?.view_count} views</span>
              {video?.required_plan === 'premium' && (
                <>
                  <span>•</span>
                  <span className="text-yellow-500 font-semibold">PREMIUM</span>
                </>
              )}
            </div>
          </div>
        </div>

        <p className="text-gray-300 leading-relaxed">{video?.description}</p>
      </div>

      {/* Back Button */}
      <div className="mt-6">
        <Link
          to="/"
          className="inline-flex items-center px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-md transition-colors"
        >
          ← Back to Browse
        </Link>
      </div>
    </div>
  );
};

export default VideoPlayer;
