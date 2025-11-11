// src/pages/VideoPage.js
import React, { useState, useEffect, useCallback } from 'react';
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

  const loadVideo = useCallback(async () => {
    try {
      setLoading(true);
      const videoRes = await videoAPI.getVideo(id);
      setVideo(videoRes.data.data);
      if (videoRes.data.data.category) {
        const relRes = await videoAPI.getVideos({ category: videoRes.data.data.category, limit: 4 });
        const filtered = relRes.data.data.videos.filter(v => String(v.id) !== id);
        setRelatedVideos(filtered);
      }
    } catch (error) {
      toast.error('Video not found');
      navigate('/');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    loadVideo();
  }, [loadVideo]);

  if (loading) return <div className="text-center py-8">Loading...</div>;
  if (!video) return <div className="text-center py-8">Video Not Found</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <VideoPlayer videoId={id} onBack={() => navigate('/')} />
        </div>
        <div className="lg:col-span-1">
          <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="font-semibold mb-4">Related Videos</h3>
            {relatedVideos.map(v => (
              <div key={v.id} onClick={() => navigate(`/video/${v.id}`)} className="cursor-pointer mb-3">
                <div className="bg-gray-700 rounded overflow-hidden mb-2">
                  <img src={v.thumbnail_url} alt={v.title} className="w-full h-20 object-cover" />
                </div>
                <h4 className="text-sm font-medium">{v.title}</h4>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPage;
