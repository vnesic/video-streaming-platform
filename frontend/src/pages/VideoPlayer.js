// src/pages/VideoPlayer.js
import React, { useState, useEffect, useCallback } from 'react';
import MuxPlayer from '@mux/mux-player-react';
import { videoAPI } from '../services/api';
import toast from 'react-hot-toast';

const VideoPlayer = ({ videoId, onBack }) => {
  const [playbackData, setPlaybackData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadVideo = useCallback(async () => {
    try {
      setLoading(true);
      const res = await videoAPI.getPlaybackUrl(videoId);
      setPlaybackData(res.data.data);
      setError(null);
    } catch (e) {
      setError('Failed to load video');
      toast.error('Failed to load video');
    } finally {
      setLoading(false);
    }
  }, [videoId]);

  useEffect(() => {
    loadVideo();
  }, [loadVideo]);

  if (loading) return <div className="text-center py-8">Loading video...</div>;
  if (error) return <div className="text-center py-8 text-red-500">{error}</div>;

  return (
    <div>
      {onBack && (
        <button onClick={onBack} className="mb-4 px-4 py-2 bg-gray-700 rounded-md">
          ← Back
        </button>
      )}
      {playbackData && (
        <MuxPlayer
          playbackId={playbackData.playbackId}
          streamType="on-demand"
          className="w-full"
          style={{ aspectRatio: '16/9' }}
        />
      )}
    </div>
  );
};

export default VideoPlayer;
