import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/pagesCSS/UploadPage.css';
import { DEMO, bootstrapDemoSession } from '../demoMode';
import { demoApi } from '../demoApi';
import { unifiedDemoAPI } from '../demoData/unifiedDemoData';


interface UploadedFile {
  file: File;
  progress: number;
  status: 'uploading' | 'processing' | 'success' | 'error';
  url?: string;
  base64?: string;
  response?: any; // Backend response data
}

const UploadPage: React.FC = () => {
  const navigate = useNavigate();
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);


  // Convert all file types to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          // remove "data:mime/type;base64," prefix, keep base64 data
          const base64Data = reader.result.split(',')[1];
          resolve(base64Data);
        } else {
          reject(new Error('Failed to read file as base64'));
        }
      };
      reader.onerror = error => reject(error);
    });
  };

  // Check if it is a image file
  const isImageFile = (file: File): boolean => {
    return file.type.startsWith('image/');
  };

  // Get file type
  const getFileType = (mimeType: string): string => {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    return 'unknown';
  }

  // Modified file processing function
  const handleFiles = async (files: File[]) => {
    const validTypes = ['image/', 'video/', 'audio/'];
    const validFiles = files.filter(file => 
      validTypes.some(type => file.type.startsWith(type))
    );

    if (validFiles.length !== files.length) {
      alert('Some files were skipped. Only image, video, and audio files are allowed.');
    }

    /*const bump = async (which: File, from = 40, to = 90) => {
      for (let p = from; p <= to; p += 10) {
        await new Promise(r => setTimeout(r, 180));
        setUploadedFiles(prev => prev.map(f => f.file === which ? { ...f, progress: p } : f));
      }
    };*/

    for (const file of validFiles) {
    // 1) 先插入一个“占位条目”，让进度区块立刻可见
    setUploadedFiles(prev => [
      ...prev,
      {
        file,
        progress: 5,
        status: 'uploading',
      }
    ]);

    try {
      // 2) base64 转换 + 状态推进
      setUploadedFiles(prev =>
        prev.map(f => f.file === file ? { ...f, status: 'processing', progress: 10 } : f)
      );

      const base64Data = await fileToBase64(file);
      setUploadedFiles(prev =>
        prev.map(f => f.file === file ? { ...f, base64: base64Data, progress: 30 } : f)
      );

      // 3) （演示模式）模拟上传进度
      await simulateUploadProcess(file, base64Data); // 会把 40% → 90% 一路推上去

      // 4) 实际“保存 / 入库”（演示：统一交给 unifiedDemoAPI）
      const saved = await unifiedDemoAPI.uploadFile(file, file.name);

      setUploadedFiles(prev => prev.map(f =>
        f.file === file
          ? {
              ...f,
              status: 'success',
              progress: 100,
              url: saved.url,
              response: { detected_species: Object.keys(saved.tags || {}) }
            }
          : f
      ));
    } catch (error) {
      console.error('Upload failed:', error);
      setUploadedFiles(prev => prev.map(f => f.file === file ? { ...f, status: 'error', progress: 0 } : f));
    }
  }
};

        

        /*// Step 2: Upload the file (using JSON format)
        const response = await uploadToS3WithBase64(file, base64Data);
        
        setUploadedFiles(prev => 
          prev.map(f => 
            f.file === file 
              ? { 
                  ...f, 
                  status: 'success', 
                  progress: 100,
                  url: response.s3_url,
                  response: response
                }
              : f
          )
        );

      } catch (error) {
        console.error('Upload failed:', error);
        setUploadedFiles(prev => 
          prev.map(f => 
            f.file === file ? { ...f, status: 'error', progress: 0 } : f
          )
        );
      }
    }
  };

  // Modified upload function - Send JSON format instead of FormData
  const uploadToS3WithBase64 = async (file: File, base64Data: string): Promise<any> => {
    // Prepare to upload data - JSON format that meets the expectations of the backend
    const uploadData = {
      files: [{
        fileName: file.name,
        fileType: getFileType(file.type),
        mimeType: file.type,
        base64Data: base64Data,
        uploadTimestamp: new Date().toISOString()
      }],
      uploadBatch: `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };

    // Simulate upload progress
    const updateProgress = (progress: number) => {
      setUploadedFiles(prev => 
        prev.map(f => 
          f.file === file ? { ...f, progress } : f
        )
      );
    };

    for (let progress = 40; progress <= 90; progress += 10) {
      await new Promise(resolve => setTimeout(resolve, 200));
      updateProgress(progress);
    }

    try {
      const response = await fetch('https://0im62d1823.execute-api.us-east-1.amazonaws.com/dev/api/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('idToken')}`
        },
        body: JSON.stringify(uploadData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Upload failed: ${response.status} ${response.statusText} - ${errorData.error || 'Unknown error'}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Upload failed');
      }

      console.log('Upload successful:', result);
      
      // Return the information of the first uploaded file
      return result.uploaded[0];
      
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  };

  */
  // 新增：模拟上传过程
  const simulateUploadProcess = async (file: File, base64Data: string): Promise<void> => {
    // 模拟上传进度
    for (let progress = 40; progress <= 90; progress += 10) {
      await new Promise(resolve => setTimeout(resolve, 200));
      setUploadedFiles(prev => 
        prev.map(f => 
          f.file === file ? { ...f, progress } : f
        )
      );
    }
  };

  // 新增：模拟物种检测
  const simulateSpeciesDetection = (fileName: string) => {
    const insects = ['honey_bee', 'butterfly', 'bumblebee', 'wasp', 'hoverfly'];
    const detected = [];
    const numSpecies = Math.floor(Math.random() * 2) + 1;
    
    for (let i = 0; i < numSpecies; i++) {
      detected.push(insects[Math.floor(Math.random() * insects.length)]);
    }
    
    return detected;
  };


  // Drag and drop processing function
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const removeFile = (fileToRemove: File) => {
    setUploadedFiles(prev => prev.filter(f => f.file !== fileToRemove));
  };

  /*const clearAllFiles = () => {
    if (confirm('Are you sure you want to clear all files? This will remove all completed and pending uploads.')) {
      setUploadedFiles([]);
    }
  };*/

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getUploadStats = () => {
    const total = uploadedFiles.length;
    const completed = uploadedFiles.filter(f => f.status === 'success').length;
    const processing = uploadedFiles.filter(f => f.status === 'uploading' || f.status === 'processing').length;
    const failed = uploadedFiles.filter(f => f.status === 'error').length;
    
    return { total, completed, processing, failed };
  };

  // Get base64 preview (image)
  const getBase64Preview = (uploadedFile: UploadedFile): string | null => {
    if (uploadedFile.base64 && isImageFile(uploadedFile.file)) {
      return `data:${uploadedFile.file.type};base64,${uploadedFile.base64}`;
    }
    return null;
  };
  const stats = getUploadStats();

  return (
    <div className="page-container">
      <div className="upload-header">
        <h1>🦋 Upload Pollinator Media Files</h1>
        <p>Upload your pollinator images, videos, and audio files for automatic species identification and ecological monitoring analysis.</p>
      </div>

      {/* Supported Species */}
      <div className="instructions-section">
        {/*<div className="supported-species">
          <h4>🐛 Supported Pollinator Species</h4>
          <div className="species-badges">
            <span className="species-badge">🐝 Honey Bee</span>
            <span className="species-badge">🦋 Butterfly</span>
            <span className="species-badge">🐛 Bumblebee</span>
            <span className="species-badge">🪲 Hoverfly</span>
            <span className="species-badge">🐝 Mining Bee</span>
            <span className="species-badge">🐛 Leafcutter Bee</span>
          </div>
        </div>*/}

      <h2>How to Upload Pollinator Files</h2>
        <div className="instruction-steps">
          <div className="step">
            <div className="step-number">1</div>
            <div className="step-content">
              <h4>Select Media Files</h4>
              <p>Drag and drop pollinator media files into the upload area, or click "Choose Files" to browse. Support for images, videos, and audio recordings.</p>
            </div>
          </div>
          <div className="step">
            <div className="step-number">2</div>
            <div className="step-content">
              <h4>AI Species Detection</h4>
              <p>Advanced machine learning models analyze your files to automatically identify and count pollinator species, with confidence scores and behavioral annotations.</p>
            </div>
          </div>
          <div className="step">
            <div className="step-number">3</div>
            <div className="step-content">
              <h4>Monitoring Integration</h4>
              <p>Data is integrated into the pollination monitoring system for temporal analysis, abundance tracking, and ecological insights.</p>
            </div>
          </div>
        </div>
        
        <div className="monitoring-features">
          <h4>Real-time Monitoring Capabilities</h4>
          <ul>
            <li>Species abundance tracking and population dynamics</li>
            <li>Temporal activity patterns and seasonal variations</li>
            <li>Spatial distribution mapping and habitat preferences</li>
            <li>Long-term population trend analysis</li>
            <li>Plant-pollinator interaction networks</li>
          </ul>
        </div>
      </div>
      

      {/* Upload Features */}
      {/*<div className="features-section">
        <h2>🌟 Upload Features</h2>
        <p>Discover what makes our upload system powerful and user-friendly.</p>
        
        <div className="upload-features">
          <div className="feature-item">
            <span>🖼️</span>
            <div>
              <strong>Smart Processing</strong>
              <p>All files auto-converted to Base64 for ML processing</p>
            </div>
          </div>
          <div className="feature-item">
            <span>🤖</span>
            <div>
              <strong>AI-Powered Analysis</strong>
              <p>Automatic bird detection and species tagging</p>
            </div>
          </div>
          <div className="feature-item">
            <span>☁️</span>
            <div>
              <strong>Secure Storage</strong>
              <p>Encrypted cloud storage with AWS S3 infrastructure</p>
            </div>
          </div>
          <div className="feature-item">
            <span>⚡</span>
            <div>
              <strong>Real-time Progress</strong>
              <p>Live upload progress with detailed status information</p>
            </div>
          </div>
          <div className="feature-item">
            <span>🔄</span>
            <div>
              <strong>Batch Upload</strong>
              <p>Upload multiple files simultaneously for efficiency</p>
            </div>
          </div>
          <div className="feature-item">
            <span>📱</span>
            <div>
              <strong>Cross-Platform</strong>
              <p>Works seamlessly on desktop, tablet, and mobile devices</p>
            </div>
          </div>
        </div>
      </div>

      {/* Upload Area */}
      <div className="upload-section">
        <h2>Select Pollinator Media Files</h2>
        <p>Upload images, videos, or audio recordings of pollinators for automated species identification.</p>
        
        <div 
          className={`upload-dropzone ${dragActive ? 'drag-active' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="upload-content">
            <div className="upload-icon">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17,8 12,3 7,8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
            </div>
            <h3>Drag and drop pollinator files here</h3>
            <p>or click to select files from your device</p>
            <input 
              type="file" 
              multiple 
              accept="image/*,video/*,audio/*"
              onChange={handleFileInput}
              id="file-input"
              className="file-input"
            />
            <label htmlFor="file-input" className="upload-button">
              Choose Pollinator Files
            </label>
          </div>
        </div>
      </div>

      

      {/* Upload Progress */}
      {uploadedFiles.length > 0 && (
        <div className="upload-progress-section">
          <div className="section-header">
            <h2>Processing Progress</h2>
            <div className="progress-summary">
              <p>
                <strong>{stats.completed}</strong> of <strong>{stats.total}</strong> files analyzed
                {stats.processing > 0 && ` • ${stats.processing} in progress`}
                {stats.failed > 0 && ` • ${stats.failed} failed`}
              </p>
            </div>
          </div>

          {stats.total > 1 && (
            <div className="upload-stats">
              <div className="stat-item">
                <span className="stat-icon">✅</span>
                <div>
                  <strong>{stats.completed}</strong>
                  <p>Analyzed</p>
                </div>
              </div>
              <div className="stat-item">
                <span className="stat-icon">⏳</span>
                <div>
                  <strong>{stats.processing}</strong>
                  <p>Processing</p>
                </div>
              </div>
              <div className="stat-item">
                <span className="stat-icon">❌</span>
                <div>
                  <strong>{stats.failed}</strong>
                  <p>Failed</p>
                </div>
              </div>
              <div className="stat-item">
                <span className="stat-icon">📊</span>
                <div>
                  <strong>{stats.total}</strong>
                  <p>Total</p>
                </div>
              </div>
            </div>
          )}
          
          <div className="upload-list">
            {uploadedFiles.map((uploadedFile, index) => (
              <div key={index} className={`upload-item ${uploadedFile.status}`}>
                <div className="file-details">
                  <div className="file-name">{uploadedFile.file.name}</div>
                  <div className="file-size">{formatFileSize(uploadedFile.file.size)}</div>
                  <div className="file-type">Type: {getFileType(uploadedFile.file.type)}</div>
                  {uploadedFile.base64 && (
                    <div className="base64-info">
                      <small>ML-ready format: {Math.round(uploadedFile.base64.length / 1024)}KB</small>
                    </div>
                  )}
                  {uploadedFile.response && uploadedFile.response.detected_species && (
                    <div className="upload-response">
                      <small>Detected: {uploadedFile.response.detected_species.join(', ')}</small>
                    </div>
                  )}
                </div>
                
                {getBase64Preview(uploadedFile) && (
                  <div className="file-preview">
                    <img 
                      src={getBase64Preview(uploadedFile)!} 
                      alt="Pollinator Preview" 
                      className="preview-thumbnail"
                    />
                  </div>
                )}
                
                <div className="progress-section">
                  <div className="progress-bar">
                    <div 
                      className={`progress-fill ${uploadedFile.status}`}
                      style={{ width: `${uploadedFile.progress}%` }}
                    ></div>
                  </div>
                  <div className="status">
                    {uploadedFile.status === 'uploading' && `${uploadedFile.progress}%`}
                    {uploadedFile.status === 'processing' && 'Analyzing...'}
                    {uploadedFile.status === 'success' && 'Complete'}
                    {uploadedFile.status === 'error' && 'Failed'}
                  </div>
                </div>

                <button 
                  onClick={() => removeFile(uploadedFile.file)}
                  className="remove-button"
                  disabled={uploadedFile.status === 'uploading' || uploadedFile.status === 'processing'}
                  title={uploadedFile.status === 'uploading' || uploadedFile.status === 'processing' ? 'Cannot remove while processing' : 'Remove file'}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          
          {stats.completed > 0 && (
            <div className="quick-actions">
              <h4>Continue Your Research</h4>
              <p>Your pollinator files have been analyzed! Explore the data and manage your monitoring system:</p>
              <div className="action-buttons">
                <button className="action-btn tags-btn">
                  Manage Species Tags
                </button>
                <button className="action-btn search-btn">
                  Search & Analyze Data
                </button>
                <button className="action-btn notifications-btn">
                  Set Monitoring Alerts
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/*uploadedFiles.length === 0 && (
        <div className="upload-tips-section">
          <h2>Pollinator Photography Tips</h2>
          <div className="tips-grid">
            <div className="tip-item">
              <span className="tip-icon">📸</span>
              <div>
                <strong>Optimal Image Quality</strong>
                <p>Use macro lenses and high resolution for detailed species identification. Focus on distinctive features like wing patterns and body structures.</p>
              </div>
            </div>
            <div className="tip-item">
              <span className="tip-icon">🎬</span>
              <div>
                <strong>Behavioral Documentation</strong>
                <p>Capture videos of pollination events, foraging behavior, and species interactions. 30-60 second clips are ideal for analysis.</p>
              </div>
            </div>
            <div className="tip-item">
              <span className="tip-icon">🔊</span>
              <div>
                <strong>Acoustic Recordings</strong>
                <p>Record wing beat frequencies and buzzing patterns. Clear audio helps identify species and measure activity levels.</p>
              </div>
            </div>
            <div className="tip-item">
              <span className="tip-icon">🗂️</span>
              <div>
                <strong>File Organization</strong>
                <p>Include date, location, and weather conditions in filenames. This metadata enhances ecological analysis capabilities.</p>
              </div>
            </div>
          </div>
        </div>
      )*/}
    </div>
  )
};

export default UploadPage;