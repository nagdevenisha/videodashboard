import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, Eye, X, Filter, AlertCircle, Loader } from 'lucide-react';

// Mock API service (replace with actual backend calls)
const API_BASE = '/api/videos';

const api = {
  async getAll(params = {}) {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    let videos = JSON.parse(localStorage.getItem('videoProfiles') || '[]');
    
    if (params.search) {
      const search = params.search.toLowerCase();
      videos = videos.filter(v => 
        v.title.toLowerCase().includes(search) || 
        v.description.toLowerCase().includes(search)
      );
    }
    
    if (params.tag) {
      videos = videos.filter(v => v.tags.includes(params.tag));
    }
    
    return videos;
  },
  
  async getById(id) {
    await new Promise(resolve => setTimeout(resolve, 300));
    const videos = JSON.parse(localStorage.getItem('videoProfiles') || '[]');
    return videos.find(v => v.id === id);
  },
  
  async create(data) {
    await new Promise(resolve => setTimeout(resolve, 500));
    const videos = JSON.parse(localStorage.getItem('videoProfiles') || '[]');
    const newVideo = { ...data, id: Date.now().toString(), createdAt: new Date().toISOString() };
    videos.push(newVideo);
    localStorage.setItem('videoProfiles', JSON.stringify(videos));
    return newVideo;
  },
  
  async update(id, data) {
    await new Promise(resolve => setTimeout(resolve, 500));
    const videos = JSON.parse(localStorage.getItem('videoProfiles') || '[]');
    const index = videos.findIndex(v => v.id === id);
    if (index !== -1) {
      videos[index] = { ...videos[index], ...data, updatedAt: new Date().toISOString() };
      localStorage.setItem('videoProfiles', JSON.stringify(videos));
      return videos[index];
    }
    throw new Error('Video not found');
  },
  
  async delete(id) {
    await new Promise(resolve => setTimeout(resolve, 500));
    const videos = JSON.parse(localStorage.getItem('videoProfiles') || '[]');
    const filtered = videos.filter(v => v.id !== id);
    localStorage.setItem('videoProfiles', JSON.stringify(filtered));
    return { success: true };
  }
};

// Utility functions
const validateVideoUrl = (url) => {
  const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]+/;
  const vimeoRegex = /^(https?:\/\/)?(www\.)?vimeo\.com\/\d+/;
  const mp4Regex = /^https?:\/\/.+\.(mp4|webm|ogg)$/i;
  return youtubeRegex.test(url) || vimeoRegex.test(url) || mp4Regex.test(url);
};

const getVideoEmbedUrl = (url) => {
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/)?.[1];
    return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
  }
  if (url.includes('vimeo.com')) {
    const videoId = url.match(/vimeo\.com\/(\d+)/)?.[1];
    return videoId ? `https://player.vimeo.com/video/${videoId}` : url;
  }
  return url;
};

function App() {
  const [videos, setVideos] = useState([]);
  const [filteredVideos, setFilteredVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [editingVideo, setEditingVideo] = useState(null);
  const [detailVideo, setDetailVideo] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    videoUrl: '',
    tags: ''
  });

  useEffect(() => {
    loadVideos();
  }, []);

  useEffect(() => {
    filterVideos();
  }, [videos, searchTerm, selectedTag]);

  const loadVideos = async () => {
    try {
      setLoading(true);
      const data = await api.getAll();
      setVideos(data);
    } catch (err) {
      setError('Failed to load videos');
    } finally {
      setLoading(false);
    }
  };

  const filterVideos = () => {
    let filtered = [...videos];
    
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(v => 
        v.title.toLowerCase().includes(search) || 
        v.description.toLowerCase().includes(search)
      );
    }
    
    if (selectedTag) {
      filtered = filtered.filter(v => v.tags.includes(selectedTag));
    }
    
    setFilteredVideos(filtered);
  };

  const getAllTags = () => {
    const tags = new Set();
    videos.forEach(v => v.tags.forEach(t => tags.add(t)));
    return Array.from(tags);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.title.trim()) {
      setError('Title is required');
      return;
    }

    if (!formData.videoUrl.trim()) {
      setError('Video URL is required');
      return;
    }

    if (!validateVideoUrl(formData.videoUrl)) {
      setError('Please provide a valid YouTube, Vimeo, or direct video URL');
      return;
    }

    try {
      setLoading(true);
      const videoData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        videoUrl: formData.videoUrl.trim(),
        tags: formData.tags.split(',').map(t => t.trim()).filter(t => t)
      };

      if (editingVideo) {
        await api.update(editingVideo.id, videoData);
      } else {
        await api.create(videoData);
      }

      await loadVideos();
      resetForm();
    } catch (err) {
      setError(err.message || 'Failed to save video');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (video) => {
    setEditingVideo(video);
    setFormData({
      title: video.title,
      description: video.description,
      videoUrl: video.videoUrl,
      tags: video.tags.join(', ')
    });
    setShowForm(true);
    setShowDetail(false);
  };

  const handleDelete = async (id) => {
    try {
      setLoading(true);
      await api.delete(id);
      await loadVideos();
      setDeleteConfirm(null);
      setShowDetail(false);
    } catch (err) {
      setError('Failed to delete video');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = (video) => {
    setDetailVideo(video);
    setShowDetail(true);
    setShowForm(false);
  };

  const resetForm = () => {
    setFormData({ title: '', description: '', videoUrl: '', tags: '' });
    setEditingVideo(null);
    setShowForm(false);
    setError('');
  };

  return (
    <div className="w-screen min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Video Profile Managements</h1>
          <p className="text-purple-200">Manage and organize your video collections</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded-lg flex items-center gap-2">
            <AlertCircle size={20} />
            <span>{error}</span>
            <button onClick={() => setError('')} className="ml-auto">
              <X size={20} />
            </button>
          </div>
        )}

        {/* Search and Filter Bar */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 mb-6 border border-white/20">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-300" size={20} />
              <input
                type="text"
                placeholder="Search videos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={selectedTag}
                onChange={(e) => setSelectedTag(e.target.value)}
                className="px-4 py-2  border  rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">All Tags</option>
                {getAllTags().map(tag => (
                  <option key={tag} value={tag}>{tag}</option>
                ))}
              </select>
              <button
                onClick={() => { setShowForm(true); setShowDetail(false); }}
                className="px-6 py-2 bg-purple-700 hover:bg-purple-700 text-white rounded-lg flex items-center gap-2 transition-colors"
              >
                <Plus size={20} />
                Add Video
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Video Grid */}
          <div className="lg:col-span-2">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <Loader className="animate-spin text-purple-400" size={48} />
              </div>
            ) : filteredVideos.length === 0 ? (
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-12 text-center border border-white/20">
                <p className="text-purple-200 text-lg">No videos found. Add your first video!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredVideos.map(video => (
                  <div key={video.id} className="bg-white/10 backdrop-blur-md rounded-xl overflow-hidden border border-white/20 hover:border-purple-500 transition-all group">
                    <div className="aspect-video bg-black/50 relative overflow-hidden">
                      <iframe
                        src={getVideoEmbedUrl(video.videoUrl)}
                        className="w-full h-full"
                        allowFullScreen
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="text-white font-semibold text-lg mb-2 truncate">{video.title}</h3>
                      <p className="text-purple-200 text-sm mb-3 line-clamp-2">{video.description}</p>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {video.tags.map(tag => (
                          <span key={tag} className="px-2 py-1 bg-purple-500/30 text-purple-200 text-xs rounded-full">
                            {tag}
                          </span>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleViewDetail(video)}
                          className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center gap-2 transition-colors"
                        >
                          <Eye size={16} />
                          View
                        </button>
                        <button
                          onClick={() => handleEdit(video)}
                          className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(video)}
                          className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar - Form or Detail */}
          <div className="lg:col-span-1">
            {showForm ? (
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 sticky top-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-white">
                    {editingVideo ? 'Edit Video' : 'Add Video'}
                  </h2>
                  <button onClick={resetForm} className="text-purple-300 hover:text-white">
                    <X size={24} />
                  </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-purple-200 mb-2 text-sm">Title *</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Video title"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-purple-200 mb-2 text-sm">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500 h-24 resize-none"
                      placeholder="Video description"
                    />
                  </div>
                  <div>
                    <label className="block text-purple-200 mb-2 text-sm">Video URL *</label>
                    <input
                      type="url"
                      value={formData.videoUrl}
                      onChange={(e) => setFormData({...formData, videoUrl: e.target.value})}
                      className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="https://youtube.com/..."
                      required
                    />
                    <p className="text-purple-300 text-xs mt-1">YouTube, Vimeo, or direct video URL</p>
                  </div>
                  <div>
                    <label className="block text-purple-200 mb-2 text-sm">Tags</label>
                    <input
                      type="text"
                      value={formData.tags}
                      onChange={(e) => setFormData({...formData, tags: e.target.value})}
                      className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="tutorial, react, coding"
                    />
                    <p className="text-purple-300 text-xs mt-1">Comma-separated tags</p>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {loading ? 'Saving...' : (editingVideo ? 'Update' : 'Create')}
                    </button>
                    <button
                      type="button"
                      onClick={resetForm}
                      className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            ) : showDetail && detailVideo ? (
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 sticky top-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-white">Video Details</h2>
                  <button onClick={() => setShowDetail(false)} className="text-purple-300 hover:text-white">
                    <X size={24} />
                  </button>
                </div>
                <div className="space-y-4">
                  <div className="aspect-video bg-black rounded-lg overflow-hidden">
                    <iframe
                      src={getVideoEmbedUrl(detailVideo.videoUrl)}
                      className="w-full h-full"
                      allowFullScreen
                    />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-xl mb-2">{detailVideo.title}</h3>
                    <p className="text-purple-200 mb-4">{detailVideo.description}</p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {detailVideo.tags.map(tag => (
                        <span key={tag} className="px-3 py-1 bg-purple-500/30 text-purple-200 rounded-full text-sm">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className="text-purple-300 text-sm">
                      <p>Created: {new Date(detailVideo.createdAt).toLocaleDateString()}</p>
                      {detailVideo.updatedAt && (
                        <p>Updated: {new Date(detailVideo.updatedAt).toLocaleDateString()}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 pt-4">
                    <button
                      onClick={() => handleEdit(detailVideo)}
                      className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center justify-center gap-2 transition-colors"
                    >
                      <Edit2 size={16} />
                      Edit
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(detailVideo)}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-12 border border-white/20 text-center sticky top-4 ml-0">
                <p className="text-purple-200">Select a video to view details or click "Add Video" to create a new one</p>
              </div>
            )}
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-xl p-6 max-w-md w-full border border-white/20">
              <h3 className="text-xl font-bold text-white mb-4">Confirm Delete</h3>
              <p className="text-purple-200 mb-6">
                Are you sure you want to delete "{deleteConfirm.title}"? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => handleDelete(deleteConfirm.id)}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold disabled:opacity-50 transition-colors"
                >
                  {loading ? 'Deleting...' : 'Delete'}
                </button>
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;