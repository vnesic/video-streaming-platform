import React, { useState } from 'react';
import { videoAPI } from '../services/api';
import toast from 'react-hot-toast';

const AdminUpload = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    requiredPlan: 'basic',
    videoUrl: ''
  });
  const [uploading, setUploading] = useState(false);
  const [uploadedVideos, setUploadedVideos] = useState([]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.videoUrl) {
      toast.error('Title and video URL are required');
      return;
    }

    try {
      setUploading(true);
      const response = await videoAPI.uploadVideo(formData);
      
      toast.success('Video upload started! Processing may take 1-5 minutes.');
      
      // Add to uploaded list
      setUploadedVideos([response.data.data, ...uploadedVideos]);
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        category: '',
        requiredPlan: 'basic',
        videoUrl: ''
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.message || 'Failed to upload video');
    } finally {
      setUploading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Upload Video</h1>

      {/* Upload Form */}
      <div className="bg-gray-800 rounded-lg p-6 mb-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Video Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
              placeholder="Enter video title"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="4"
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
              placeholder="Enter video description"
            />
          </div>

          {/* Video URL */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Video URL *
            </label>
            <input
              type="url"
              name="videoUrl"
              value={formData.videoUrl}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
              placeholder="https://storage.example.com/video.mp4"
              required
            />
            <p className="text-sm text-gray-400 mt-2">
              Upload your video to S3/Cloudinary first, then paste the public URL here
            </p>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Category
            </label>
            <input
              type="text"
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
              placeholder="e.g., Tutorial, Entertainment, Education"
            />
          </div>

          {/* Required Plan */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Required Plan
            </label>
            <select
              name="requiredPlan"
              value={formData.requiredPlan}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
            >
              <option value="basic">Basic</option>
              <option value="premium">Premium</option>
            </select>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={uploading}
            className={`w-full py-3 rounded-lg font-semibold transition-colors ${
              uploading
                ? 'bg-gray-600 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {uploading ? 'Uploading...' : 'Upload Video to Mux'}
          </button>
        </form>
      </div>

      {/* Recently Uploaded Videos */}
      {uploadedVideos.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Recently Uploaded</h2>
          <div className="space-y-3">
            {uploadedVideos.map((video) => (
              <div
                key={video.id}
                className="flex items-center justify-between p-4 bg-gray-700 rounded-lg"
              >
                <div>
                  <h3 className="font-medium">{video.title}</h3>
                  <p className="text-sm text-gray-400">
                    Status: <span className="capitalize">{video.status}</span>
                  </p>
                </div>
                <div className={`px-3 py-1 rounded text-sm ${
                  video.status === 'ready' 
                    ? 'bg-green-600' 
                    : 'bg-yellow-600'
                }`}>
                  {video.status === 'ready' ? '✓ Ready' : '⏳ Processing'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-900/20 border border-blue-500 rounded-lg p-6 mt-8">
        <h3 className="font-semibold mb-2">📝 How to Upload Videos</h3>
        <ol className="list-decimal list-inside space-y-2 text-sm text-gray-300">
          <li>Upload your video file to cloud storage (S3, Cloudinary, etc.)</li>
          <li>Make sure the video URL is publicly accessible</li>
          <li>Paste the URL in the form above</li>
          <li>Fill in video details and submit</li>
          <li>Wait 1-5 minutes for Mux to process the video</li>
          <li>Video will automatically appear in your app when ready!</li>
        </ol>
      </div>
    </div>
  );
};

export default AdminUpload;