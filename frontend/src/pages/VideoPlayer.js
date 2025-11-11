import React, { useState, useEffect } from 'react';
import MuxPlayer from '@mux/mux-player-react';
import { videoAPI } from '../services/api';
import toast from 'react-hot-toast';

const VideoPlayer = ({ videoId, onBack }) => {
  const [playbackData, setPlaybackData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadVideo();
  }, [videoId]);

  const loadVideo = async () => {
    try {
      setLoading(true);
      const response = await videoAPI.getPlaybackUrl(videoId);
      setPlaybackData(response.data.data);
      setError(null);
    } catch (error) {
      console.error('Failed to load video:', error);
      
      if (error.response?.data?.code === 'NO_SUBSCRIPTION') {
        setError('You need an active subscription to watch this video.');
        toast.error('Subscription required', {
          icon: '🔒'
        });
      } else if (error.response?.data?.code === 'INSUFFICIENT_PLAN') {
        setError(error.response.data.message);
        toast.error('Upgrade your plan to watch this video', {
          icon: '⬆️'
        });
      } else {
        setError('Failed to load video. Please try again.');
        toast.error('Failed to load video');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTimeUpdate = async (event) => {
    if (!playbackData) return;

    const currentTime = Math.floor(event.target.currentTime);
    const duration = event.target.duration;
    const completed = currentTime >= duration * 0.95; // 95% watched = completed

    // Update every 10 seconds
    if (currentTime % 10 === 0) {
      try {
        await videoAPI.updateProgress(videoId, {
          progress: currentTime,
          completed
        });
      } catch (error) {
        console.error('Failed to update progress:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="w-full">
        {onBack && (
          <button
            onClick={onBack}
            className="mb-4 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md transition-colors"
          >
            ← Back
          </button>
        )}
        <div className="animate-pulse bg-gray-800 aspect-video rounded-lg flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-gray-400">Loading video...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full">
        {onBack && (
          <button
            onClick={onBack}
            className="mb-4 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md transition-colors"
          >
            ← Back
          </button>
        )}
        <div className="bg-red-900/20 border border-red-500 aspect-video rounded-lg flex flex-col items-center justify-center p-8">
          <svg
            className="w-16 h-16 text-red-500 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <h3 className="text-xl font-semibold mb-2 text-red-400">Video Unavailable</h3>
          <p className="text-gray-300 text-center">{error}</p>
          <button
            onClick={loadVideo}
            className="mt-4 px-6 py-2 bg-red-600 hover:bg-red-700 rounded-md transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!playbackData) {
    return (
      <div className="w-full">
        {onBack && (
          <button
            onClick={onBack}
            className="mb-4 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md transition-colors"
          >
            ← Back
          </button>
        )}
        <div className="bg-gray-800 aspect-video rounded-lg flex items-center justify-center">
          <p className="text-gray-400">Video data unavailable</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {onBack && (
        <button
          onClick={onBack}
          className="mb-4 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md transition-colors flex items-center"
        >
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Videos
        </button>
      )}
      
      <div className="bg-black rounded-lg overflow-hidden">
        <MuxPlayer
          playbackId={playbackData.playbackId}
          streamType="on-demand"
          onTimeUpdate={handleTimeUpdate}
          metadata={{
            video_id: videoId,
            video_title: playbackData.title
          }}
          className="w-full"
          style={{ aspectRatio: '16/9' }}
        />
      </div>
      
      <div className="mt-6">
        <h1 className="text-3xl font-bold mb-2">{playbackData.title}</h1>
        <div className="flex items-center text-gray-400 text-sm">
          <svg
            className="w-5 h-5 mr-2"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
              clipRule="evenodd"
            />
          </svg>
          Now Playing
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
