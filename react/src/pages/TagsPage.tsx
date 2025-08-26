// pages/TagsPage.tsx - Updated to use real backend APIs instead of mock data
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/pagesCSS/TagsPage.css';
import { unifiedDemoAPI, DemoTagKey } from '../demoData/unifiedDemoData';

interface FileWithTags {
  id: string;
  fileName: string;
  thumbnailUrl: string;
  fullUrl: string;
  fileType: 'image' | 'video' | 'audio';
  tags: { [species: string]: number };
  uploadDate: string;
  autoTags: { [species: string]: number };
  manualTags: { [species: string]: number };
}


const TagsPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation(); // 现在可以正常使用
  const [files, setFiles] = useState<FileWithTags[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingFile, setEditingFile] = useState<string | null>(null);
  const [newTagSpecies, setNewTagSpecies] = useState('');
  const [newTagCount, setNewTagCount] = useState(1);
  const [bulkTagsInput, setBulkTagsInput] = useState('');
  const [bulkOperation, setBulkOperation] = useState<'add' | 'remove'>('add');
  const [operationResult, setOperationResult] = useState<string | null>(null);
  const [availableBirds, setAvailableBirds] = useState<string[]>([]);


  useEffect(() => {
    loadBirdsAndFiles();
  }, []);

  const discoverAvailableBirds = async () => {
    const cachedBirds = localStorage.getItem("pollinator_available_species");
    if (cachedBirds) {
      setAvailableBirds(JSON.parse(cachedBirds));
    } else {
      const commonPollinators = [
        "Honey Bee", "Butterfly", "Bumblebee", "Wasp", "Hoverfly", 
        "Beetle", "Moth", "Ant", "Fly", "Mining Bee"
      ];
      setAvailableBirds(commonPollinators);
      localStorage.setItem("pollinator_available_species", JSON.stringify(commonPollinators));
    }
  };


    {/*// Load any birds we've learned from previous file uploads or searches
    const confirmedBirds = JSON.parse(
      localStorage.getItem("birdnet_confirmed_birds") || "[]"
    );
    const userSearchedBirds = JSON.parse(
      localStorage.getItem("birdnet_searched_birds") || "[]"
    );

    // Start with what we already know
    let knownBirds = [...new Set([...confirmedBirds, ...userSearchedBirds])];

    if (knownBirds.length === 0) {
      console.log("No known birds yet, testing common species...");

      const commonBirds = [
        "Crow", "Pigeon", "Eagle", "Sparrow", "Robin", "Owl", "Hawk", 
        "Cardinal", "Bluejay", "Woodpecker", "Duck", "Goose", "Swan", 
        "Falcon", "Heron", "Kingfisher", "Magpie", "Raven", "Parrot", 
        "Dove", "Finch", "Wren"
      ];

      for (const bird of commonBirds) {
        try {
          const response = await fetch(
            `https://0im62d1823.execute-api.us-east-1.amazonaws.com/dev/api/search?tag1=${encodeURIComponent(
              bird
            )}&count1=1`,
            {
              method: "GET",
              headers: {
                Authorization: `Bearer ${sessionStorage.getItem("idToken")}`,
              },
            }
          );

          if (response.ok) {
            const data = await response.json();
            if (data.links && data.links.length > 0) {
              knownBirds.push(bird);
            }
          }
        } catch (error) {
          console.error(`Error checking bird ${bird}:`, error);
        }

        await new Promise((resolve) => setTimeout(resolve, 300));
      }

      localStorage.setItem("birdnet_confirmed_birds", JSON.stringify(knownBirds));
    }

    console.log("Available birds:", knownBirds);
    setAvailableBirds(knownBirds.sort());
    setIsLoadingBirds(false);

    localStorage.setItem("birdnet_available_birds", JSON.stringify(knownBirds));
    localStorage.setItem("birdnet_birds_discovered_at", new Date().toISOString());
    
    return knownBirds;
  };*/}


  const loadBirdsAndFiles = async () => {
    setLoading(true);
    await discoverAvailableBirds();
    await loadFiles();
  };

    
   /*) // Check if we have cached bird data
    const cachedBirds = localStorage.getItem("birdnet_available_birds");
    const discoveredAt = localStorage.getItem("birdnet_birds_discovered_at");

    if (cachedBirds && discoveredAt) {
      const cacheAge = Date.now() - new Date(discoveredAt).getTime();
      const oneDay = 24 * 60 * 60 * 1000;

      if (cacheAge < oneDay) {
        setAvailableBirds(JSON.parse(cachedBirds));
        setIsLoadingBirds(false);
        console.log("Using cached bird data");
      } else {
        await discoverAvailableBirds();
      }
    } else {
      await discoverAvailableBirds();
    }
    
    // Now load files
    await loadFiles();
  };(*/

  const loadFiles = async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      const allFiles = unifiedDemoAPI.getAllFiles();

      /*// Use the discovered birds for file discovery instead of hardcoded list
      const birdsToSearch = availableBirds.length > 0 ? availableBirds : await discoverAvailableBirds();
      const allFiles = new Map<string, any>();
      
      // Search for each known bird species to discover files
      for (const bird of birdsToSearch) {
        try {
          const response = await fetch(
            `https://0im62d1823.execute-api.us-east-1.amazonaws.com/dev/api/search?tag1=${encodeURIComponent(bird)}`,
            {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${sessionStorage.getItem('idToken')}`
              }
            }
          );

          if (response.ok) {
            const data = await response.json();
            if (data.links && data.links.length > 0) {
              for (const url of data.links) {
                if (!allFiles.has(url)) {
                  const fileInfo = await extractFileInfoFromUrl(url, bird);
                  if (fileInfo) {
                    allFiles.set(url, fileInfo);
                  }
                }
              }
            }
          }
        } catch (error) {
          console.error(`Error searching for ${bird}:`, error);
        }
      }

      // Convert Map to array and format for the component
      const convertedFiles = Array.from(allFiles.values()).map((file: any) => ({
        id: file.file_id || generateIdFromUrl(file.url),
        fileName: file.fileName || extractFileNameFromUrl(file.url),
        thumbnailUrl: file.thumbnailUrl || file.url,
        fullUrl: file.s3_url || file.url,
        fileType: file.file_type || detectFileTypeFromUrl(file.url),
        tags: file.tags || {},
        autoTags: file.tags || {},
        manualTags: {},
        uploadDate: file.upload_date || new Date().toISOString()
      }));*/

      
      // 转换数据格式
      const converted: FileWithTags[] = allFiles.map(file => ({
        id: file.id,
        fileName: file.name,
        thumbnailUrl: file.url,
        fullUrl: file.url,
        fileType: file.type || 'image', // 修复：使用正确的字段名
        tags: file.tags || {},
        autoTags: file.autoTags || file.tags || {},
        manualTags: file.manualTags || {},
        uploadDate: file.uploadedAt // 修复：使用正确的字段名
      }));

      // 检查是否从ResultsPage传来了特定的文件URL列表
      const resultUrls = location.state?.resultUrls || null;
      const filtered = resultUrls ? 
        converted.filter(f => resultUrls.includes(f.thumbnailUrl)) : 
        converted;

      setFiles(filtered);
    } catch (error) {
      console.error('Error loading files:', error);
      setOperationResult('Failed to load files. Please try again.');
      setFiles([]);
    } finally {
      setLoading(false);
    }
  };

  /*// Helper function to extract file information from URL
  const extractFileInfoFromUrl = async (url: string, detectedBird: string) => {
    try {
      // Extract file ID from URL structure (assuming format like /uploads/images/date/uuid_filename.ext)
      const urlParts = url.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const fileId = fileName.split('_')[0]; // Extract UUID part
      
      return {
        file_id: fileId,
        fileName: fileName,
        url: url,
        file_type: detectFileTypeFromUrl(url),
        tags: { [detectedBird]: 1 }, // We know this bird exists in this file
        thumbnailUrl: url.includes('thumbnails/') ? url : undefined,
        s3_url: url
      };
    } catch (error) {
      console.error('Error extracting file info from URL:', error);
      return null;
    }
  };

  // Helper functions
  const generateIdFromUrl = (url: string): string => {
    // Extract UUID from URL or generate a hash-based ID
    const fileName = url.split('/').pop() || '';
    const uuidMatch = fileName.match(/^([a-f0-9-]{36})/);
    return uuidMatch ? uuidMatch[1] : btoa(url).slice(0, 8);
  };

  const extractFileNameFromUrl = (url: string): string => {
    const fileName = url.split('/').pop() || 'unknown_file';
    return fileName.split('_').slice(1).join('_') || fileName; // Remove UUID prefix
  };

  const detectFileTypeFromUrl = (url: string): 'image' | 'video' | 'audio' => {
    const extension = url.split('.').pop()?.toLowerCase() || '';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) return 'image';
    if (['mp4', 'avi', 'mov', 'webm'].includes(extension)) return 'video';
    if (['mp3', 'wav', 'ogg', 'm4a', 'aac'].includes(extension)) return 'audio';
    return 'image'; // default
  };*/

  const toggleFileSelection = (fileId: string) => {
    setSelectedFiles(prev => 
      prev.includes(fileId) 
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    );
  };

  const selectAllFiles = () => {
    if (selectedFiles.length === files.length) {
      setSelectedFiles([]);
    } else {
      setSelectedFiles(files.map(f => f.id));
    }
  };

  /*const addTagToFile = async (fileId: string, species: string, count: number) => {
    try {
      const file = files.find(f => f.id === fileId);
      if (!file) {
        throw new Error('File not found');
      }

      const fileUrl = file.thumbnailUrl || file.fullUrl;

      const response = await fetch('https://0im62d1823.execute-api.us-east-1.amazonaws.com/dev/api/tags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('idToken')}`
        },
        body: JSON.stringify({
          urls: [fileUrl],
          operation: 1, // 1 for add
          tags: [`${species},${count}`]
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add tag');
      }

      // Update local state
      setFiles(prev => prev.map(file => 
        file.id === fileId 
          ? {
              ...file,
              tags: { ...file.tags, [species]: (file.tags[species] || 0) + count },
              manualTags: { ...file.manualTags, [species]: (file.manualTags[species] || 0) + count }
            }
          : file
      ));

      setNewTagSpecies('');
      setNewTagCount(1);
      setEditingFile(null);
      setOperationResult(`Successfully added "${species}: ${count}" tag to file`);
    } catch (error) {
      console.error('Error adding tag:', error);
      setOperationResult(`Failed to add tag: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };*/

  // 模拟添加标签API调用
  const addTagToFile = async (fileId: string, species: string, count: number) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const updatedFile = unifiedDemoAPI.addTag(fileId, species as DemoTagKey, count);
      if (updatedFile) {
        await loadFiles();
        setNewTagSpecies('');
        setNewTagCount(1);
        setEditingFile(null);
        setOperationResult(`Successfully added "${species}: ${count}" tag to file`);
      }
    } catch (error: any) {
      setOperationResult(`Failed to add tag: ${error.message}`);
    }
  };

  

  /*const removeTagFromFile = async (fileId: string, species: string, count?: number) => {
    try {
      const file = files.find(f => f.id === fileId);
      if (!file) return;

      const currentCount = file.tags[species] || 0;
      const removeCount = count || currentCount;
      const fileUrl = file.thumbnailUrl || file.fullUrl;

      const response = await fetch('https://0im62d1823.execute-api.us-east-1.amazonaws.com/dev/api/tags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('idToken')}`
        },
        body: JSON.stringify({
          urls: [fileUrl],
          operation: 0, // 0 for remove
          tags: [`${species},${removeCount}`]
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to remove tag');
      }

      // Update local state
      setFiles(prev => prev.map(f => 
        f.id === fileId 
          ? {
              ...f,
              tags: { 
                ...f.tags, 
                [species]: Math.max(0, currentCount - removeCount) === 0 
                  ? undefined 
                  : Math.max(0, currentCount - removeCount)
              },
              manualTags: { 
                ...f.manualTags, 
                [species]: Math.max(0, (f.manualTags[species] || 0) - removeCount) === 0
                  ? undefined
                  : Math.max(0, (f.manualTags[species] || 0) - removeCount)
              }
            }
          : f
      ));

      setOperationResult(`Successfully removed "${species}: ${removeCount}" tag from file`);
    } catch (error) {
      console.error('Error removing tag:', error);
      setOperationResult(`Failed to remove tag: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };*/
  // 模拟删除标签API调用
  const removeTagFromFile = async (fileId: string, species: string, count?: number) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const updatedFile = unifiedDemoAPI.removeTag(fileId, species as DemoTagKey, count);
      if (updatedFile) {
        await loadFiles();
        setOperationResult(`Successfully removed "${species}" tag from file`);
      }
    } catch (error: any) {
      setOperationResult(`Failed to remove tag: ${error.message}`);
    }
  };


  const parseBulkTags = (input: string): { [species: string]: number } => {
    const tags: { [species: string]: number } = {};
    const pairs = input.split(/[;,]/).map(s => s.trim()).filter(s => s);
    
    for (const pair of pairs) {
      const parts = pair.split(/[,:]/);
      if (parts.length === 2) {
        const species = parts[0].trim().toLowerCase();
        const count = parseInt(parts[1].trim());
        if (species && !isNaN(count) && count > 0) {
          tags[species] = count;
        }
      }
    }
    
    return tags;
  };

  const handleBulkTagging = async () => {
    if (selectedFiles.length === 0) {
      setOperationResult('Please select files to apply bulk tagging');
      return;
    }

    if (!bulkTagsInput.trim()) {
      setOperationResult('Please enter tags in the format: honey_bee:2;butterfly:1');
      return;
    }

    const tags = parseBulkTags(bulkTagsInput);
    if (Object.keys(tags).length === 0) {
      setOperationResult('Invalid tag format. Use: honey_bee:2;butterfly:1');
      return;
    }

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      unifiedDemoAPI.bulkTagOperation(selectedFiles, tags, bulkOperation);
      
      await loadFiles();
      setBulkTagsInput('');
      setSelectedFiles([]);
      setOperationResult(`Successfully ${bulkOperation === 'add' ? 'added' : 'removed'} tags for ${selectedFiles.length} files`);
    } catch (error: any) {
      console.error('Bulk tagging error:', error);
      setOperationResult(`Bulk tagging failed: ${error.message}`);
    }
  };

    /*try {
      const selectedUrls = files
        .filter(file => selectedFiles.includes(file.id))
        .map(file => file.thumbnailUrl || file.fullUrl)
        .filter(url => url);

      const operationCode = bulkOperation === 'add' ? 1 : 0;
      const tagsArray = Object.entries(tags).map(([species, count]) => `${species},${count}`);

      console.log('Sending bulk operation:', {
        urls: selectedUrls,
        operation: operationCode,
        tags: tagsArray
      });

      const response = await fetch('https://0im62d1823.execute-api.us-east-1.amazonaws.com/dev/api/tags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('idToken')}`
        },
        body: JSON.stringify({
          urls: selectedUrls,
          operation: operationCode,
          tags: tagsArray
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Bulk tagging failed');
      }

      // Update local state
      setFiles(prev => prev.map(file => {
        if (!selectedFiles.includes(file.id)) return file;

        const updatedTags = { ...file.tags };
        const updatedManualTags = { ...file.manualTags };

        Object.entries(tags).forEach(([species, count]) => {
          if (bulkOperation === 'add') {
            updatedTags[species] = (updatedTags[species] || 0) + count;
            updatedManualTags[species] = (updatedManualTags[species] || 0) + count;
          } else {
            const newCount = Math.max(0, (updatedTags[species] || 0) - count);
            const newManualCount = Math.max(0, (updatedManualTags[species] || 0) - count);
            
            if (newCount === 0) {
              delete updatedTags[species];
            } else {
              updatedTags[species] = newCount;
            }
            
            if (newManualCount === 0) {
              delete updatedManualTags[species];
            } else {
              updatedManualTags[species] = newManualCount;
            }
          }
        });

        return {
          ...file,
          tags: updatedTags,
          manualTags: updatedManualTags
        };
      }));

      setBulkTagsInput('');
      setSelectedFiles([]);
      setOperationResult(`Successfully ${bulkOperation === 'add' ? 'added' : 'removed'} tags for ${selectedFiles.length} files`);
    } catch (error) {
      console.error('Bulk tagging error:', error);
      setOperationResult(`Bulk tagging failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };*/

  const clearResult = () => {
    setOperationResult(null);
  };

  const formatDate = (dateString: string): string => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'Recently';
    }
  };

  // 安全的图片组件
  const SafePollinatorImage: React.FC<{
    src: string;
    alt: string;
    className?: string;
  }> = ({ src, alt, className = "" }) => {
    const [imageError, setImageError] = useState(false);

    if (imageError) {
      return (
        <div className={`image-placeholder ${className}`}>
          <span className="placeholder-icon">🦋</span>
          <p>Pollinator Image</p>
        </div>
      );
    }
    return (
      <img 
        src={src} 
        alt={alt} 
        className={`file-thumbnail ${className}`}
        onError={() => setImageError(true)}
        loading="lazy"
      />
    );
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-container">
          <div className="spinner-large"></div>
          <p>Loading pollinator files and tags...</p>
        </div>
      </div>
    );
  }
  // 确定显示模式
  const isFilteredView = location.state?.resultUrls?.length > 0;
  const viewTitle = isFilteredView ? 
    `🏷️ Tag Management - Search Results (${files.length} files)` : 
    `🏷️ Pollinator Tag Management`;

  return (
    <div className="page-container">
      {/* Header */}
      <div className="tags-header">
        <h1>{viewTitle}</h1>
        <p>
          {isFilteredView ? 
            `Managing tags for ${files.length} files from your search results.` :
            "Add, edit, or remove pollinator species tags from your uploaded files. Manage tags individually or in bulk to improve monitoring and ecological analysis."
          }
        </p>
        
        {isFilteredView && (
          <div className="filter-notice">
            <span className="filter-icon">🔍</span>
            <span>Showing results from your search. <button onClick={() => {
              navigate('/tags', { replace: true, state: {} });
              window.location.reload();
            }} className="show-all-btn">Show All Files</button></span>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="instructions-section">
        <h2>How to Manage Pollinator Tags</h2>
        <div className="instruction-steps">
          <div className="step">
            <div className="step-number">1</div>
            <div className="step-content">
              <h4>Individual Tagging</h4>
              <p>Click the "+ Add Tag" button on any file to add pollinator species tags with specific counts for monitoring purposes.</p>
            </div>
          </div>
          <div className="step">
            <div className="step-number">2</div>
            <div className="step-content">
              <h4>Bulk Operations</h4>
              <p>Select multiple files using checkboxes, then apply tag changes to all selected files simultaneously for efficient data management.</p>
            </div>
          </div>
          <div className="step">
            <div className="step-number">3</div>
            <div className="step-content">
              <h4>AI + Manual Tags</h4>
              <p>Combine AI-detected pollinator tags with manual corrections to ensure accurate ecological monitoring data.</p>
            </div>
          </div>
        </div>
      </div>

      {/* File Management Section */}
      <div className="file-management-section">
        <div className="section-header">
          <h2>📂 Your Pollinator Files & Tags</h2>
          <p>Manage tags for your pollinator monitoring files.</p>
          
          <div className="compact-selection-summary">
            <div className="selection-stats">
              <span className="stat-compact">
                <strong>{files.length}</strong> Total Files
              </span>
              <span className="stat-compact">
                <strong>{selectedFiles.length}</strong> Selected
              </span>
            </div>
            <button onClick={selectAllFiles} className="select-all-btn btn btn-primary">
              {selectedFiles.length === files.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>
        </div>

        {files.length === 0 ? (
          <div className="no-files">
            <div className="no-files-icon">🦋</div>
            <h3>{isFilteredView ? 'No files in search results' : 'No pollinator files found'}</h3>
            <p>
              {isFilteredView ? 
                'Your search returned no results. Try different search criteria.' :
                'Upload some pollinator images, videos, or audio files first to start monitoring.'
              }
            </p>
            <div className="no-files-actions">
              {isFilteredView ? (
                <button onClick={() => navigate('/search')} className="btn btn-primary">
                  🔍 New Search
                </button>
              ) : (
                <button onClick={() => navigate('/upload')} className="btn btn-primary">
                  📤 Upload Pollinator Files
                </button>
              )}
              <button onClick={loadFiles} className="btn btn-secondary">
                🔄 Refresh
              </button>
            </div>
          </div>
        ) : (
          <div className="files-grid">
            {files.map((file) => (
              <div 
                key={file.id} 
                className={`file-card ${selectedFiles.includes(file.id) ? 'selected' : ''}`}
              >
                <div className="file-header">
                  <input
                    type="checkbox"
                    checked={selectedFiles.includes(file.id)}
                    onChange={() => toggleFileSelection(file.id)}
                    className="file-checkbox"
                  />
                </div>

                <div className="file-preview">
                  <SafePollinatorImage 
                    src={file.thumbnailUrl} 
                    alt={file.fileName}
                  />
                </div>

                <div className="file-info">
                  <h4 className="file-name" title={file.fileName}>
                    {file.fileName.length > 25 
                      ? `${file.fileName.substring(0, 22)}...` 
                      : file.fileName
                    }
                  </h4>
                  <p className="upload-date">
                    {formatDate(file.uploadDate)}
                  </p>

                  <div className="tags-section">
                    <div className="auto-tags">
                      <h5>🤖 AI-detected</h5>
                      <div className="tags-list">
                        {Object.entries(file.autoTags || {}).filter(([_, count]) => count > 0).map(([species, count]) => (
                          <span key={species} className="tag auto-tag">
                            {species}: {count}
                          </span>
                        ))}
                        {Object.keys(file.autoTags || {}).length === 0 && (
                          <span className="no-tags">Processing...</span>
                        )}
                      </div>
                    </div>

                    <div className="manual-tags">
                      <h5>👤 Manual tags</h5>
                      <div className="tags-list">
                        {Object.entries(file.manualTags || {}).filter(([_, count]) => count > 0).map(([species, count]) => (
                          <span key={species} className="tag manual-tag">
                            {species}: {count}
                            <button
                              onClick={() => removeTagFromFile(file.id, species, 1)}
                              className="remove-tag-btn"
                              title="Remove one"
                            >
                              −
                            </button>
                            <button
                              onClick={() => removeTagFromFile(file.id, species)}
                              className="remove-all-tag-btn"
                              title="Remove all"
                            >
                              ✕
                            </button>
                          </span>
                        ))}
                        {Object.keys(file.manualTags || {}).length === 0 && (
                          <span className="no-tags">No manual tags</span>
                        )}
                      </div>
                    </div>

                    <div className="add-tag-section">
                      {editingFile === file.id ? (
                        <div className="tag-input-form">
                          <input
                            type="text"
                            placeholder="Pollinator species"
                            value={newTagSpecies}
                            onChange={(e) => setNewTagSpecies(e.target.value)}
                            className="species-input"
                            list="species-suggestions"
                          />
                          <input
                            type="number"
                            min="1"
                            max="100"
                            value={newTagCount}
                            onChange={(e) => setNewTagCount(parseInt(e.target.value) || 1)}
                            className="count-input"
                          />
                          <button
                            onClick={() => addTagToFile(file.id, newTagSpecies.toLowerCase(), newTagCount)}
                            disabled={!newTagSpecies.trim()}
                            className="add-tag-btn"
                          >
                            Add
                          </button>
                          <button
                            onClick={() => setEditingFile(null)}
                            className="cancel-btn"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setEditingFile(file.id)}
                          className="edit-tags-btn"
                        >
                          + Add Tag
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Bulk Operations */}
        {selectedFiles.length > 0 && (
          <div className="bulk-operations">
            <div className="bulk-section">
              <h3>📦 Bulk Tag Operations</h3>
              <p>Apply the same tag changes to {selectedFiles.length} selected files simultaneously.</p>
              
              <div className="bulk-controls">
                <select 
                  value={bulkOperation}
                  onChange={(e) => setBulkOperation(e.target.value as 'add' | 'remove')}
                  className="operation-select"
                >
                  <option value="add">Add Tags</option>
                  <option value="remove">Remove Tags</option>
                </select>
                
                <input
                  type="text"
                  placeholder="honey_bee:2;butterfly:1;hoverfly:3"
                  value={bulkTagsInput}
                  onChange={(e) => setBulkTagsInput(e.target.value)}
                  className="bulk-tags-input"
                />
                
                <button 
                  onClick={handleBulkTagging}
                  disabled={!bulkTagsInput.trim()}
                  className="apply-bulk-btn"
                >
                  Apply to {selectedFiles.length} files
                </button>
              </div>
              <p className="bulk-help">
                Format: species,count separated by semicolons. Example: honey_bee:2;butterfly:1;hoverfly:3
              </p>
            </div>
          </div>
        )}

        {/* Operation Result */}
        {operationResult && (
          <div className={`operation-result ${
            operationResult.includes('failed') || operationResult.includes('Failed') || 
            operationResult.includes('Please') || operationResult.includes('Invalid')
              ? 'error' 
              : 'success'
          }`}>
            <p>{operationResult}</p>
            <button onClick={clearResult} className="clear-result-btn">✕</button>
          </div>
        )}
      </div>

      {/* Pollinator Species Suggestions */}
      <datalist id="species-suggestions">
        {availableBirds.map((species, index) => (
          <option key={index} value={species.toLowerCase().replace(/\s+/g, '_')} />
        ))}
      </datalist>
    </div>
  );
};

export default TagsPage;