import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import '../styles/pagesCSS/ResultsPage.css';
import { DEMO } from '../demoMode';
import { unifiedDemoAPI } from '../demoData/unifiedDemoData';

interface SearchParams {
  searchType: 'tags' | 'species' | 'url' | 'file';
  results: string[];
  tags?: { [species: string]: number };
  species?: string[];
  thumbnailUrl?: string;
  uploadFile?: File;
  query?: string;
}

const ResultsPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'relevance' | 'date' | 'name'>('relevance');
  const [filterType, setFilterType] = useState<'all' | 'image' | 'video' | 'audio'>('all');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());

  const searchParams: SearchParams = location.state?.searchParams;

  const toUrls = (raw: unknown): string[] => {
    const arr: any[] = Array.isArray(raw) ? (raw as any[]) : [];
    if (arr.length > 0 && typeof arr[0] === 'string') return arr as string[];
    return arr
      .map((r: any) => (r && typeof r.url === 'string' ? r.url : null))
      .filter((u: any): u is string => typeof u === 'string');
  };

  // 在组件开头添加一个新的函数
  const handleManageTagsNavigation = () => {
    // 传递当前结果的URL列表到TagsPage
    const resultUrls = getFilteredResults();
    navigate('/tags', {
      state: {
        resultUrls: resultUrls, // 传递搜索结果的URL列表
        fromSearch: true,
        searchQuery: formatSearchQuery()
      }
    });
  };

  useEffect(() => {
    if (!searchParams) {
      navigate('/search');
      return;
    }
    setLoading(true);

    const toUrls = (arr: any): string[] =>
      Array.isArray(arr)
        ? arr
            .map(v => (typeof v === 'string' ? v : v?.url))
            .filter((u): u is string => typeof u === 'string' && !!u)
        : [];

    const processResults = async () => {
      try {
        const raw = searchParams.results || [];
        const urls = toUrls(raw);
        setResults(urls);
        setError(null);
      } catch (error) {
        console.error('Error processing search results:', error);
        setError('Failed to process search results');
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    processResults();
  }, [searchParams, navigate]);

  // Utility functions
  const getFileTypeFromUrl = (url: string): 'image' | 'video' | 'audio' => {
    if (url.startsWith('blob:')) return 'image'; // 本地 objectURL 以图像处理
    if (url.includes('thumb.jpg') || /\.(jpg|jpeg|png|gif|webp)(\?|$)/i.test(url)) return 'image';
    if (/\.(mp4|avi|mov|webm)(\?|$)/i.test(url)) return 'video';
    if (/\.(mp3|wav|ogg|m4a)(\?|$)/i.test(url)) return 'audio';
    return 'image';
  };

  const getFileNameFromUrl = (url: string): string => {
    try {
      if (url.startsWith('blob:')) return 'local_upload';
      const fileName = url.split('?')[0].split('/').pop() || 'unknown_file';
      return decodeURIComponent(fileName);
    } catch {
      return 'unknown_file';
    }
  };

  const getFilteredResults = (): string[] => {
    let filtered = results;

    if (filterType !== 'all') {
      filtered = filtered.filter(url => getFileTypeFromUrl(url) === filterType);
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return getFileNameFromUrl(a).localeCompare(getFileNameFromUrl(b));
        case 'relevance':
        case 'date':
        default:
          return 0;
      }
    });

    return filtered;
  };

  // File operations
  const downloadFile = (url: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('URL copied to clipboard!');
    } catch (error) {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('URL copied to clipboard!');
    }
  };

  // Selection management
  const toggleFileSelection = (url: string) => {
    const newSelected = new Set(selectedFiles);
    if (newSelected.has(url)) {
      newSelected.delete(url);
    } else {
      newSelected.add(url);
    }
    setSelectedFiles(newSelected);
  };

  const selectAllFiles = () => {
    const filteredResults = getFilteredResults();
    setSelectedFiles(new Set(filteredResults));
  };

  const clearSelection = () => {
    setSelectedFiles(new Set());
  };

  // Bulk delete operation
  const handleBulkDelete = async () => {
  if (selectedFiles.size === 0) {
    alert('Please select files to delete');
    return;
  }
  if (!confirm(`Are you sure you want to delete ${selectedFiles.size} file(s)? This action cannot be undone.`)) {
    return;
  }

  const toDelete = Array.from(selectedFiles);

  if (DEMO) {
    const api = unifiedDemoAPI as any;
    try {
      if (typeof api.removeByUrls === 'function') {
        api.removeByUrls(toDelete);
      } else if (typeof api.deleteFiles === 'function') {
        api.deleteFiles(toDelete);
      } else if (typeof api.delete === 'function') {
        toDelete.forEach((u: string) => api.delete(u));
      }
      // 前端列表移除（无论上面有没有真实方法，UI 都生效）
      setResults(prev => prev.filter(u => !selectedFiles.has(u)));
      clearSelection();
      alert('Deleted (demo)');
    } catch {
      // 即使 mock 调用失败，也别让 UI 挂；仍然移除本地项
      setResults(prev => prev.filter(u => !selectedFiles.has(u)));
      clearSelection();
      alert('Deleted locally (demo fallback)');
    }
    return;
  }

  // ❄️ 非 DEMO：走你原来的后端 DELETE
  try {
    const response = await fetch(
      'https://0im62d1823.execute-api.us-east-1.amazonaws.com/dev/api/file',
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('idToken')}`
        },
        body: JSON.stringify({ urls: toDelete })
      }
    );

    if (response.ok || response.status === 204) {
      const remaining = results.filter(u => !selectedFiles.has(u));
      setResults(remaining);
      clearSelection();
      alert('Files deleted successfully!');
    } else {
      const err = await response.json().catch(() => ({}));
      alert(`Error: ${err.message || 'Failed to delete files'}`);
    }
  } catch (e) {
    console.error('Error deleting files:', e);
    alert('Error deleting files. Please try again.');
  }
};

  const formatSearchQuery = (): string => {
    switch (searchParams?.searchType) {
      case 'tags':
        return searchParams.tags ? 
          Object.entries(searchParams.tags).map(([species, count]) => `${species}: ${count}`).join(', ') : 
          'Tag-based search';
      case 'species':
        return searchParams.species ? searchParams.species.join(', ') 
        : (searchParams.query || 'Species search');
      case 'url':
        return searchParams.thumbnailUrl || 'URL search';
      case 'file':
        return searchParams.uploadFile?.name || 'File-based search';
      default:
        return 'Search results';
    }
  };

  // Show loading or no search params
  if (!searchParams) {
    return (
      <div className="results-page">
        <div className="file-management-section">
          <div className="no-results">
            <div className="no-results-icon">🔍</div>
            <h3>No search data found</h3>
            <p>Please perform a search first to view your files.</p>
            <div className="no-results-actions">
              <button onClick={() => navigate('/search')} className="btn btn-primary">
                🔍 Go to Search
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="results-page">
        <div className="loading-container">
          <div className="spinner-large"></div>
          <p>Searching for files...</p>
        </div>
      </div>
    );
  }

  const filteredResults = getFilteredResults();

  return (
    <div className="results-page">
      {/* Header */}
      <div className="results-header">
        <div className="results-info">
          <h1>Search Results</h1>
          <p className="query-info">Query: {formatSearchQuery()}</p>
          <p className="results-count">Found {filteredResults.length} of {results.length} files</p>
        </div>
        <div className="header-actions">
          <button onClick={() => navigate('/search')} className="btn btn-primary">
            🔍 New Search
          </button>
          <button onClick={handleManageTagsNavigation} className="btn btn-secondary">
            🏷️ Manage Tags
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          <span>Error: {error}</span>
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {/* File Management Instructions */}
      {results.length > 0 && (
        <div className="file-management-section">
          <div className="section-header">
            <h2>📂 File Operations</h2>
            <p>View, download, and manage your search results</p>
          </div>
          
          {selectedFiles.size === 0 && (
            <div className="operation-info">
              <h4>💡 Available operations:</h4>
              <ul>
                <li><strong>View files:</strong> Browse through your search results</li>
                <li><strong>Delete files:</strong> Select files and remove them permanently</li>
                <li><strong>Download files:</strong> Save individual files to your device</li>
                <li><strong>Copy URLs:</strong> Get shareable links for files</li>
                <li><strong>Manage tags:</strong> Use the "Manage Tags" button to edit bird species tags</li>
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Selected Files Actions */}
      {selectedFiles.size > 0 && (
        <div className="file-management-section">
          <div className="management-actions-info">
            <h4>🎯 {selectedFiles.size} Files Selected</h4>
            <div className="actions-grid">
              <div className="action-info">
                <span className="action-icon">🗑️</span>
                <div>
                  <strong>Delete Files</strong>
                  <p>Permanently remove selected files from S3 storage and database</p>
                </div>
              </div>
              <div className="action-info">
                <span className="action-icon">📥</span>
                <div>
                  <strong>Download</strong>
                  <p>Use individual download buttons on each file</p>
                </div>
              </div>
              <div className="action-info">
                <span className="action-icon">📋</span>
                <div>
                  <strong>Copy URLs</strong>
                  <p>Use individual copy buttons to get shareable links</p>
                </div>
              </div>
              <div className="action-info">
                <span className="action-icon">🏷️</span>
                <div>
                  <strong>Manage Tags</strong>
                  <p>Go to Tag Management page for these search results</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="results-controls">
        <h2>🔧 Filter & Sort</h2>
        <p>Refine your search results</p>
        
        <div className="search-controls">
          <div className="filter-sort-controls">
            <select 
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="filter-select form-select"
            >
              <option value="all">All Types ({results.length})</option>
              <option value="image">Images ({results.filter(url => getFileTypeFromUrl(url) === 'image').length})</option>
              <option value="video">Videos ({results.filter(url => getFileTypeFromUrl(url) === 'video').length})</option>
              <option value="audio">Audio ({results.filter(url => getFileTypeFromUrl(url) === 'audio').length})</option>
            </select>

            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="sort-select form-select"
            >
              <option value="relevance">Sort by Relevance</option>
              <option value="name">Sort by Name</option>
              <option value="date">Sort by Date</option>
            </select>
          </div>

          <div className="selection-controls">
            <button onClick={selectAllFiles} className="btn btn-primary">
              Select All ({filteredResults.length})
            </button>
            {selectedFiles.size > 0 && (
              <button onClick={clearSelection} className="btn btn-secondary">
                Clear ({selectedFiles.size})
              </button>
            )}
            <span className="selection-info">
              {selectedFiles.size} of {filteredResults.length} files selected
            </span>
          </div>
        </div>
      </div>

      {/* Bulk Actions - Only Delete */}
      {selectedFiles.size > 0 && (
        <div className="bulk-actions-bar">
          <span className="selected-info">
            🎯 {selectedFiles.size} files selected - Available action:
          </span>
          <div className="bulk-actions">
            <button onClick={handleBulkDelete} className="btn btn-danger">
              🗑️ Delete Selected
            </button>
          </div>
        </div>
      )}

      {/* Results Grid */}
      <div className="file-management-section">
        <div className="section-header">
          <h2>📂 Your Files</h2>
          <p>
            {filteredResults.length === results.length 
              ? `Showing all ${results.length} files from your search`
              : `Showing ${filteredResults.length} of ${results.length} files after filtering`
            }
          </p>
        </div>

        {filteredResults.length === 0 ? (
          <div className="no-results">
            <div className="no-results-icon">🔍</div>
            <h3>No results found</h3>
            <p>
              {results.length === 0 
                ? "No files match your search criteria. Try different search terms or species names."
                : "No files match your current filter settings."
              }
            </p>
            <div className="no-results-actions">
              <button onClick={() => navigate('/search')} className="btn btn-primary">
                🔍 Try Different Search
              </button>
              <button onClick={() => navigate('/upload')} className="btn btn-secondary">
                📤 Upload Files
              </button>
            </div>
          </div>
        ) : (
          <div className="results-grid">
            {filteredResults.map((url, index) => {
              const fileType = getFileTypeFromUrl(url);
              const fileName = getFileNameFromUrl(url);
              const isSelected = selectedFiles.has(url);
              
              return (
                <div key={index} className={`result-card ${isSelected ? 'selected' : ''}`}>
                  <div className="card-header">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleFileSelection(url)}
                      className="file-checkbox"
                    />
                    <div className="file-type-badge">
                      {fileType === 'image' && '🖼️'}
                      {fileType === 'video' && '🎥'}
                      {fileType === 'audio' && '🎵'}
                      <span>{fileType.toUpperCase()}</span>
                    </div>
                  </div>

                  <div className="card-content" onClick={() => toggleFileSelection(url)}>
                    {fileType === 'image' ? (
                      <img 
                        src={url} 
                        alt={fileName}
                        className="file-thumbnail"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.parentElement?.classList.add('image-error');
                        }}
                      />
                    ) : (
                      <div className="file-placeholder">
                        <span className="file-icon">
                          {fileType === 'video' ? '🎥' : '🎵'}
                        </span>
                        <p>{fileType.toUpperCase()}</p>
                      </div>
                    )}
                  </div>

                  <div className="card-footer">
                    <h4 className="file-name" title={fileName}>
                      {fileName.length > 20 ? `${fileName.substring(0, 17)}...` : fileName}
                    </h4>
                    
                    <div className="file-actions">
                      {fileType === 'image' && (
                        <button 
                          onClick={() => setPreviewImage(url)}
                          className="action-btn"
                          title="View full size"
                        >
                          👁️
                        </button>
                      )}
                      
                      <button 
                        onClick={() => downloadFile(url, fileName)}
                        className="action-btn"
                        title="Download file"
                      >
                        📥
                      </button>
                      
                      <button 
                        onClick={() => copyToClipboard(url)}
                        className="action-btn"
                        title="Copy URL"
                      >
                        📋
                      </button>
                      
                      {fileType === 'image' && url.includes('thumb.jpg') && (
                        <button 
                          onClick={async () => {
                            try {
                              const response = await fetch(`https://0im62d1823.execute-api.us-east-1.amazonaws.com/dev/api/file?thumbnailUrl=${encodeURIComponent(url)}`, {
                                headers: {
                                  'Authorization': `Bearer ${sessionStorage.getItem('idToken')}`
                                }
                              });
                              if (response.ok) {
                                const data = await response.json();
                                setPreviewImage(data.fullSizeUrl);
                              } else {
                                alert('Failed to get full-size image');
                              }
                            } catch (error) {
                              console.error('Error getting full-size image:', error);
                              alert('Error getting full-size image');
                            }
                          }}
                          className="action-btn"
                          title="View full size"
                        >
                          🔍
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Tips */}
        {results.length > 0 && (
          <div className="search-stats">
            <h4>💡 Tips:</h4>
            <ul>
              <li><strong>Found files to delete?</strong> Use the checkboxes to select files for deletion</li>
              <li><strong>Need to manage tags?</strong> Use the "Manage Tags" button to edit species tags for these results</li>
              <li><strong>Want to find more files?</strong> Try searching for common bird species like "crow", "pigeon", or "sparrow"</li>
              <li><strong>Need different results?</strong> Use the "New Search" button to search with different criteria</li>
            </ul>
          </div>
        )}
      </div>

      {/* Image Preview Modal */}
      {previewImage && (
        <div className="modal-overlay" onClick={() => setPreviewImage(null)}>
          <div className="modal-content image-preview" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setPreviewImage(null)} className="close-btn">✕</button>
            <img src={previewImage} alt="Preview" className="preview-image" />
            <div className="modal-actions">
              <button onClick={() => downloadFile(previewImage, getFileNameFromUrl(previewImage))} className="btn btn-primary">
                📥 Download
              </button>
              <button onClick={() => copyToClipboard(previewImage)} className="btn btn-secondary">
                📋 Copy URL
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultsPage;