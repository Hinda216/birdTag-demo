import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/pagesCSS/SearchPage.css";
import { unifiedDemoAPI } from '../demoData/unifiedDemoData';

interface TagQuery {
  bird: string;
  count: number;
}

interface SearchFormData {
  searchType: "tags" | "species" | "url" | "file";
  tagQueries: TagQuery[];
  thumbnailUrl: string;
  uploadFile: File | null;
}

// 模拟传粉者数据（与 demoFiles 的物种标签一致）
const mockPollinatorData = [
  { url: 'https://source.unsplash.com/Mkk_9x42Sbg/400x260', species: ['honey_bee'], confidence: 0.93 },
  { url: 'https://source.unsplash.com/qSX733ZLMw8/400x260', species: ['butterfly'], confidence: 0.90 },
  { url: 'https://source.unsplash.com/WluuATNGTgw/400x260', species: ['bumblebee'], confidence: 0.95 },
  { url: 'https://source.unsplash.com/cnpDuWHbBl4/400x260', species: ['wasp'], confidence: 0.86 },
  { url: 'https://source.unsplash.com/2fpyPtVcm2M/400x260', species: ['hoverfly'], confidence: 0.89 },
  { url: 'https://source.unsplash.com/NkUuUEdqbpM/400x260', species: ['beetle'], confidence: 0.88 },
  { url: 'https://source.unsplash.com/WsP0RIhnZ3I/400x260', species: ['moth'], confidence: 0.87 },
  { url: 'https://source.unsplash.com/x9PS04F3s-A/400x260', species: ['ant'], confidence: 0.90 },
  { url: 'https://source.unsplash.com/X4DAtPvhgwo/400x260', species: ['fly'], confidence: 0.88 },
  { url: 'https://source.unsplash.com/FpmSLjo408E/400x260', species: ['bee'], confidence: 0.91 },
  // 组合标签的例子（便于 species OR 匹配）
  { url: 'https://source.unsplash.com/OFEvgVfr6iU/400x260', species: ['honey_bee', 'bee'], confidence: 0.92 },
];

const SearchPage: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<SearchFormData>({
    searchType: "tags",
    tagQueries: [{ bird: "", count: 1 }],
    thumbnailUrl: "",
    uploadFile: null,
  });
  const [isSearching, setIsSearching] = useState(false);
  const [availableBirds, setAvailableBirds] = useState<string[]>([]);
  const [isLoadingBirds, setIsLoadingBirds] = useState(true);

  // 模拟API函数 - 替换原有的真实API调用
  const mockSearchAPI = async (searchParams: any) => {
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
    
    if (searchParams.searchType === 'tags') {
      return mockPollinatorData.filter(item => 
        searchParams.tagQueries.every((q: TagQuery) => 
          q.bird && item.species.some(s => 
            s.toLowerCase().includes(q.bird.toLowerCase())
          )
        )
      );
    } else if (searchParams.searchType === 'species') {
      return mockPollinatorData.filter(item =>
        searchParams.tagQueries.some((q: TagQuery) =>
          q.bird && item.species.some(s => 
            s.toLowerCase().includes(q.bird.toLowerCase())
          )
        )
      );
    }
    
    return mockPollinatorData;
  };

  const mockFileAnalysisAPI = async (file: File) => {
    const steps = ['Uploading file...', 'Processing...', 'AI detection...', 'Finding similar files...'];
    
    for (let i = 0; i < steps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log(steps[i]);
    }
    
    return {
      detected: { 'honey_bee': 2, 'butterfly': 1 },
      similarFiles: mockPollinatorData.slice(0, 3)
    };
  };


  useEffect(() => {
    const loadBirds = async () => {
      setIsLoadingBirds(true);
      
      // 模拟从本地缓存加载传粉者物种
      const cachedBirds = localStorage.getItem("pollinator_available_species");
      
      if (cachedBirds) {
        setAvailableBirds(JSON.parse(cachedBirds));
      } else {
        // 初始化传粉者物种列表
        const commonPollinators = [
          "honey_bee", "butterfly", "bumblebee", "wasp", "hoverfly", 
          "beetle", "moth", "ant", "fly", "bee"
        ];
        setAvailableBirds(commonPollinators);
        localStorage.setItem("pollinator_available_species", JSON.stringify(commonPollinators));
      }
      
      setIsLoadingBirds(false);
    };

    loadBirds();
  }, []);

  const addTagQuery = () => {
    setFormData((prev) => ({
      ...prev,
      tagQueries: [...prev.tagQueries, { bird: "", count: 1 }],
    }));
  };

  const removeTagQuery = (index: number) => {
    if (formData.tagQueries.length > 1) {
      setFormData((prev) => ({
        ...prev,
        tagQueries: prev.tagQueries.filter((_, i) => i !== index),
      }));
    }
  };

  const updateTagQuery = (
    index: number,
    field: keyof TagQuery,
    value: string | number
  ) => {
    setFormData((prev) => ({
      ...prev,
      tagQueries: prev.tagQueries.map((query, i) =>
        i === index ? { ...query, [field]: value } : query
      ),
    }));

    // add learning feature from user input bird species name
    if (field === 'bird' && typeof value === 'string') {
      const cleanValue = value.trim();
      if (cleanValue.length >= 3 && /^[a-zA-Z]+$/.test(cleanValue)) {
        learnBirdFromUserInput(cleanValue);
      }
    }
  };

  const learnBirdFromUserInput = (birdName: string) => {
    const cleanBird = birdName.trim();
    if (cleanBird && 
      cleanBird.length >= 3 && 
      cleanBird.length <= 20 && 
      /^[a-zA-Z\s]+$/.test(cleanBird) && // only character and space
      !cleanBird.includes('  ')) { // Authentication Status
    
      // Capitalize first letter to match database format
      const formattedBird = cleanBird.charAt(0).toUpperCase() + cleanBird.slice(1).toLowerCase();
      
      if (!availableBirds.includes(formattedBird)) {
        const updatedBirds = [...availableBirds, formattedBird].sort();
        setAvailableBirds(updatedBirds);
        
        // Save to localStorage for future sessions
        localStorage.setItem('birdnet_available_birds', JSON.stringify(updatedBirds));
        console.log('Learned new bird from user input:', formattedBird);
      }
    }
  };

  {/*const cleanInvalidSuggestions = () => {
    const validBirds = availableBirds.filter(bird => {
      return bird.length >= 3 && 
             bird.length <= 20 && 
             /^[a-zA-Z\s]+$/.test(bird) &&
             !bird.includes('  ') &&
             bird.trim() === bird;
    });
    
    if (validBirds.length !== availableBirds.length) {
      setAvailableBirds(validBirds);
      localStorage.setItem('birdnet_available_birds', JSON.stringify(validBirds));
      console.log('Cleaned invalid suggestions, remaining:', validBirds.length);
    }
  };*/}

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData((prev) => ({ ...prev, uploadFile: file }));
  };

  const validateForm = (): boolean => {
    switch (formData.searchType) {
      case "tags":
      case "species":
        return formData.tagQueries.some((q) => q.bird.trim() !== "");
      case "url":
        return formData.thumbnailUrl.trim() !== "";
      case "file":
        return formData.uploadFile !== null;
      default:
        return false;
    }
  };

  // Method to discover available birds from database by testing search API
  const discoverAvailableBirds = async () => {
    setIsLoadingBirds(true);

    // Load any birds we've learned from previous file uploads or searches
    const confirmedBirds = JSON.parse(
      localStorage.getItem("birdnet_confirmed_birds") || "[]"
    );
    const userSearchedBirds = JSON.parse(
      localStorage.getItem("birdnet_searched_birds") || "[]"
    );

    // Start with what we already know
    let knownBirds = [...new Set([...confirmedBirds, ...userSearchedBirds])];

    if (knownBirds.length === 0) {
      // Only do API testing if we have no known birds yet
      console.log("No known birds yet, testing common species...");

      const commonBirds = [
        "Crow",
        "Pigeon",
        "Eagle",
        "Sparrow",
        "Robin",
        "Owl",
        "Hawk",
        "Cardinal",
        "Bluejay",
        "Woodpecker",
        "Duck",
        "Goose",
        "Swan",
        "Falcon",
        "Heron",
        "Kingfisher",
        "Magpie",
        "Raven",
        "Parrot",
        "Dove",
        "Finch",
        "Wren",
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

      // Save the confirmed birds
      localStorage.setItem(
        "birdnet_confirmed_birds",
        JSON.stringify(knownBirds)
      );
    }

    console.log("Available birds:", knownBirds);
    setAvailableBirds(knownBirds.sort());
    setIsLoadingBirds(false);

    // Cache the results
    localStorage.setItem("birdnet_available_birds", JSON.stringify(knownBirds));
    localStorage.setItem(
      "birdnet_birds_discovered_at",
      new Date().toISOString()
    );
  };

  // Function to record successful searches
  const recordSuccessfulSearch = (birdName: string, hasResults: boolean) => {
    if (hasResults && birdName.trim()) {
      const formattedBird =
        birdName.charAt(0).toUpperCase() + birdName.slice(1).toLowerCase();
      const searchedBirds = JSON.parse(
        localStorage.getItem("birdnet_searched_birds") || "[]"
      );

      if (!searchedBirds.includes(formattedBird)) {
        searchedBirds.push(formattedBird);
        localStorage.setItem(
          "birdnet_searched_birds",
          JSON.stringify(searchedBirds)
        );

        // Update current available birds
        if (!availableBirds.includes(formattedBird)) {
          const updatedBirds = [...availableBirds, formattedBird].sort();
          setAvailableBirds(updatedBirds);
          localStorage.setItem(
            "birdnet_available_birds",
            JSON.stringify(updatedBirds)
          );
          console.log(
            "Learned new bird from successful search:",
            formattedBird
          );
        }
      }
    }
  };

  // Enhanced addNewlyDiscoveredBirds function
  const addNewlyDiscoveredBirds = (detectedTags: Record<string, number>) => {
    const newBirds = Object.keys(detectedTags).map(
      (bird) => bird.charAt(0).toUpperCase() + bird.slice(1).toLowerCase()
    );

    // These are 100% confirmed to exist in database
    const confirmedBirds = JSON.parse(
      localStorage.getItem("birdnet_confirmed_birds") || "[]"
    );
    const updatedConfirmed = [...new Set([...confirmedBirds, ...newBirds])];
    localStorage.setItem(
      "birdnet_confirmed_birds",
      JSON.stringify(updatedConfirmed)
    );

    // Update available birds
    const allBirds = [...new Set([...availableBirds, ...newBirds])].sort();
    if (allBirds.length > availableBirds.length) {
      setAvailableBirds(allBirds);
      localStorage.setItem("birdnet_available_birds", JSON.stringify(allBirds));
      console.log("Added newly discovered birds from file analysis:", newBirds);
    }
  };

  /*const handleSearch = async () => {
    if (!validateForm()) {
      alert("Please fill in all required fields");
      return;
    }

    setIsSearching(true);

    try {
      let searchParams: any = {
        searchType: formData.searchType,
      };

      switch (formData.searchType) {
        case "tags":
          const tagParams = new URLSearchParams();
          formData.tagQueries
            .filter((q) => q.bird.trim())
            .forEach((q, index) => {
              tagParams.append(`tag${index + 1}`, q.bird);
              tagParams.append(`count${index + 1}`, q.count.toString());
            });

          const response = await fetch(
            `https://0im62d1823.execute-api.us-east-1.amazonaws.com/dev/api/search?${tagParams.toString()}`,
            {
              method: "GET",
              headers: {
                Authorization: `Bearer ${sessionStorage.getItem("idToken")}`,
              },
            }
          );

          if (!response.ok) {
            throw new Error("Search failed");
          }

          const data = await response.json();
          searchParams.results = data.links || [];
          searchParams.searchType = "tags";
          
          //add learn feature, record success search history
          formData.tagQueries
            .filter((q) => q.bird.trim())
            .forEach((q) => {
              recordSuccessfulSearch(q.bird, data.links && data.links.length > 0);
            });
          break;

        case "species":
          const speciesParams = new URLSearchParams();
          formData.tagQueries
            .filter((q) => q.bird.trim())
            .forEach((q, index) => {
              speciesParams.append(`tag${index + 1}`, q.bird);
            });

          const speciesResponse = await fetch(
            `https://0im62d1823.execute-api.us-east-1.amazonaws.com/dev/api/search?${speciesParams.toString()}`,
            {
              method: "GET",
              headers: {
                Authorization: `Bearer ${sessionStorage.getItem("idToken")}`,
              },
            }
          );

          if (!speciesResponse.ok) {
            throw new Error("Species search failed");
          }

          const speciesData = await speciesResponse.json();
          searchParams.results = speciesData.links || [];
          searchParams.searchType = "species";
          
          // add learning feature, record success search result
          formData.tagQueries
            .filter((q) => q.bird.trim())
            .forEach((q) => {
              recordSuccessfulSearch(q.bird, speciesData.links && speciesData.links.length > 0);
            });
          break;

        case "url":
          const urlParams = new URLSearchParams();
          urlParams.append("thumbnailUrl", formData.thumbnailUrl);

          const urlResponse = await fetch(
            `https://0im62d1823.execute-api.us-east-1.amazonaws.com/dev/api/file?${urlParams.toString()}`,
            {
              method: "GET",
              headers: {
                Authorization: `Bearer ${sessionStorage.getItem("idToken")}`,
              },
            }
          );

          if (!urlResponse.ok) {
            throw new Error("URL search failed");
          }

          const urlData = await urlResponse.json();
          searchParams.results = [urlData.fullSizeUrl];
          searchParams.searchType = "url";
          searchParams.thumbnailUrl = formData.thumbnailUrl;
          break;

        case "file":
          if (formData.uploadFile) {
            // Step 1: Request presigned URL for file upload
            const initUpload = await fetch(
              "https://0im62d1823.execute-api.us-east-1.amazonaws.com/dev/api/search_by_file",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${sessionStorage.getItem("idToken")}`,
                },
                body: JSON.stringify({
                  contentType: formData.uploadFile.type,
                }),
              }
            );

            if (!initUpload.ok)
              throw new Error("Failed to initialize file search");

            const initData = await initUpload.json();
            const { uploadUrl, filePath } = initData;

            // Step 2: Upload file to S3 using presigned URL
            await fetch(uploadUrl, {
              method: "PUT",
              body: formData.uploadFile,
              headers: {
                "Content-Type": formData.uploadFile.type,
              },
            });

            // Step 3: Poll for detection results with better debugging
            let resultData = null;
            for (let i = 0; i < 10; i++) {
              console.log(`Polling attempt ${i + 1}/10 for file: ${filePath}`);
              try{
                const pollRes = await fetch(
                  `https://0im62d1823.execute-api.us-east-1.amazonaws.com/dev/api/search_by_file?filename=${filePath}`,
                  {
                    method: "GET",
                    headers: {
                      Authorization: `Bearer ${sessionStorage.getItem("idToken")}`,
                    },
                  }
                );

                console.log(`Poll response status: ${pollRes.status}`);
                
                if (pollRes.status === 200) {
                  resultData = await pollRes.json();
                  console.log('Detection completed:', resultData);
                  break;
                } else if (pollRes.status === 100) {
                  console.log('Still processing...');
                } else if (pollRes.status === 500) {
                  console.log('Processing error occurred');
                } else {
                  const errorText = await pollRes.text();
                  console.log(`Unexpected status ${pollRes.status}:`, errorText);
                }
              } catch (error) {
                console.error(error);
              }


              await new Promise((res) => setTimeout(res, 2000)); // Increase to 2 seconds
            }

            // Step 4: Learn newly discovered birds (100% real data from detection)
            addNewlyDiscoveredBirds(resultData);

            // Step 5: Use detected tags to search for similar files using existing GET API
            const tagParams = new URLSearchParams();
            let tagIndex = 1;

            // Convert detected tags to URL parameters format for existing search API
            Object.entries(resultData).forEach(([species, count]) => {
              tagParams.append(`tag${tagIndex}`, species);
              tagParams.append(`count${tagIndex}`, count.toString());
              tagIndex++;
            });

            // Step 6: Search for files with matching tags using existing GET search endpoint
            const finalSearch = await fetch(
              `https://0im62d1823.execute-api.us-east-1.amazonaws.com/dev/api/search?${tagParams.toString()}`,
              {
                method: "GET",
                headers: {
                  Authorization: `Bearer ${sessionStorage.getItem("idToken")}`,
                },
              }
            );

            if (!finalSearch.ok) {
              throw new Error("Failed to search for similar files");
            }

            const searchResult = await finalSearch.json();

            // Prepare search results for navigation
            searchParams.results = searchResult.links || [];
            searchParams.searchType = "file";
            searchParams.uploadFile = formData.uploadFile;
            searchParams.detectedTags = resultData; // Save detected tags for display in results page
          }
          break;
      }

      navigate("/results", { state: { searchParams } });
    } catch (error) {
      console.error("Search failed:", error);
      alert(
        `Search failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsSearching(false);
    }
  };*/

  // 放在组件内其它函数下面
  const toUrls = (raw: unknown): string[] => {
    const arr = Array.isArray(raw) ? (raw as any[]) : [];
    if (arr.length && typeof arr[0] === 'string') return arr as string[];
    return arr
      .map((r: any) => (r && typeof r.url === 'string' ? r.url : null))
      .filter((u: any): u is string => typeof u === 'string');
  };
  const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, '_');

  const handleSearch = async () => {
    if (!validateForm()) {
      alert("Please fill in all required fields");
      return;
    }

    setIsSearching(true);
    try {
      const all = unifiedDemoAPI.getAllFiles(); // [{id,name,url,tags,...}]
      let urls: string[] = [];

      if (formData.searchType === 'tags') {
        const queries = formData.tagQueries
          .filter(q => q.bird.trim())
          .map(q => ({ bird: norm(q.bird), count: q.count || 1 }));

        urls = all
          .filter(f => {
            const tagMap = f.tags || {};
            return queries.every(q => (tagMap[q.bird] || 0) >= q.count);
          })
          .map(f => f.url);

        navigate('/results', {
          state: {
            searchParams: {
              searchType: 'tags',
              results: urls,
              // 结果页会用这个来显示“Query: …”
              tags: Object.fromEntries(queries.map(q => [q.bird, q.count])),
            },
          },
        });
      } else if (formData.searchType === 'species') {
        const wanted = formData.tagQueries
          .filter(q => q.bird.trim())
          .map(q => norm(q.bird));

        urls = all
          .filter(f => {
            const tagMap = f.tags || {};
            return wanted.some(b => (tagMap[b] || 0) >= 1);
          })
          .map(f => f.url);

        navigate('/results', {
          state: {
            searchParams: {
              searchType: 'species',
              results: urls,
              species: wanted,
            },
          },
        });
      } else if (formData.searchType === 'url') {
        const raw = await unifiedDemoAPI.searchFiles('url', []);
        urls = toUrls(raw);
        navigate('/results', {
          state: {
            searchParams: {
              searchType: 'url',
              results: urls,
              thumbnailUrl: formData.thumbnailUrl,
            },
          },
        });
      } else if (formData.searchType === 'file') {
        if (!formData.uploadFile) throw new Error('No file selected');
        // 这里只做演示：从 mock 拿相似文件；结果转 url[]
        const raw = await unifiedDemoAPI.searchFiles('file', []);
        urls = toUrls(raw);
        navigate('/results', {
          state: {
            searchParams: {
              searchType: 'file',
              results: urls,
              // 不能安全传 File 对象，传名字即可
              uploadFile: { name: formData.uploadFile.name } as any,
            },
          },
        });
      }
    } catch (e) {
      console.error('Search failed:', e);
      alert('Search failed. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  /*// useEffect to load bird data when component mounts
  useEffect(() => {
    const loadBirds = async () => {
      // Check if we have cached bird data
      const cachedBirds = localStorage.getItem("birdnet_available_birds");
      const discoveredAt = localStorage.getItem("birdnet_birds_discovered_at");

      if (cachedBirds && discoveredAt) {
        // Calculate how old the cached data is
        const cacheAge = Date.now() - new Date(discoveredAt).getTime();
        const oneDay = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

        // If cache is less than 24 hours old, use cached data
        if (cacheAge < oneDay) {
          setAvailableBirds(JSON.parse(cachedBirds));
          setIsLoadingBirds(false);
          console.log("Using cached bird data");
          return;
        }
      }

      // If no cache or cache is expired, discover birds from database
      console.log("Discovering available birds from database...");
      await discoverAvailableBirds();

      setTimeout(() => {
        cleanInvalidSuggestions();
      }, 1000);
    };

    loadBirds();
  }, []);*/

  const searchTypeDescriptions = {
    tags: "Find files containing specific bird species with minimum counts (AND operation)",
    species: "Find files containing specific bird species (any count)",
    url: "Find the full-size image from a thumbnail URL",
    file: "Upload a file to find similar content with matching bird tags",
  };

  return (
    <div className="page-container">
      {/* Header Section */}
      <div className="search-header">
        <h1>🔍 Search & Manage Files</h1>
        <p>
          Find and manage your bird media files using various search criteria. 
          Search for files and then manage them with bulk operations.
        </p>

        <div className="search-overview">
          <div className="overview-card">
            <div className="overview-icon">🏷️</div>
            <h4>Tag Search</h4>
            <p>Find files with specific bird counts</p>
          </div>
          <div className="overview-card">
            <div className="overview-icon">🐦</div>
            <h4>Species Search</h4>
            <p>Find any files with these birds</p>
          </div>
          <div className="overview-card">
            <div className="overview-icon">🔗</div>
            <h4>URL Search</h4>
            <p>Get full-size from thumbnail</p>
          </div>
          <div className="overview-card">
            <div className="overview-icon">📁</div>
            <h4>File Search</h4>
            <p>Find similar content</p>
          </div>
        </div>
      </div>

      {/* How to Use Section */}
      <div className="instructions-section">
        <h2>📋 How to Search & Manage Files</h2>
        <p>
          Search for your bird files, then select and manage them with bulk operations.
        </p>

        <div className="management-workflow">
          <div className="workflow-step">
            <div className="step-number">1</div>
            <div className="step-content">
              <h4>🔍 Search for Files</h4>
              <p>Choose a search method and enter criteria</p>
            </div>
          </div>
          <div className="workflow-arrow">→</div>
          <div className="workflow-step">
            <div className="step-number">2</div>
            <div className="step-content">
              <h4>✅ Select Files</h4>
              <p>Use checkboxes in results to select files</p>
            </div>
          </div>
          <div className="workflow-arrow">→</div>
          <div className="workflow-step">
            <div className="step-number">3</div>
            <div className="step-content">
              <h4>⚡ Manage Files</h4>
              <p>Delete files or manage tags in bulk</p>
            </div>
          </div>
        </div>

        <div className="search-tips">
          <h4>💡 Search Tips</h4>
          <ul>
            <li>Use specific bird names like "crow", "pigeon", "eagle" for better accuracy</li>
            <li>Tag search finds files with minimum bird counts (AND operation)</li>
            <li>Species search finds any files containing specified birds</li>
            <li>Upload high-quality files for better similarity matching</li>
          </ul>
        </div>
      </div>

      {/* Search Form Section */}
      <div className="search-form-section">
        <h2>🔍 Search Configuration</h2>
        <p>Configure your search parameters below to find files.</p>

        <div className="search-form">
          <div className="search-type-section">
            <h3>Search Type</h3>
            <div className="search-type-options">
              {(
                Object.keys(searchTypeDescriptions) as Array<
                  keyof typeof searchTypeDescriptions
                >
              ).map((type) => (
                <label key={type} className="search-type-option">
                  <input
                    type="radio"
                    name="searchType"
                    value={type}
                    checked={formData.searchType === type}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        searchType: e.target.value as any,
                      }))
                    }
                  />
                  <div className="option-content">
                    <span className="option-title">
                      {type === "tags" && "🏷️ Tag-based Search"}
                      {type === "species" && "🐦 Species Search"}
                      {type === "url" && "🔗 URL Search"}
                      {type === "file" && "📁 File-based Search"}
                    </span>
                    <span className="option-description">
                      {searchTypeDescriptions[type]}
                    </span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {(formData.searchType === "tags" ||
            formData.searchType === "species") && (
            <div className="tag-search-section">
              <h3>Bird Search Criteria</h3>
              <p>
                Enter the bird species you want to search for. You can add
                multiple species for more specific results.
              </p>

              {/* Add loading status here */}
              {isLoadingBirds && (
                <div
                  className="loading-birds"
                  style={{
                    padding: "10px",
                    background: "#f0f0f0",
                    borderRadius: "5px",
                    margin: "10px 0",
                  }}
                >
                  <p>🔍 Discovering available birds from database...</p>
                </div>
              )}

              {!isLoadingBirds && (
                <p
                  className="birds-info"
                  style={{ color: "#666", fontSize: "14px" }}
                >
                  Found {availableBirds.length} bird species in database
                </p>
              )}

              <div className="tag-queries">
                {formData.tagQueries.map((query, index) => (
                  <div key={index} className="tag-query-row">
                    <input
                      type="text"
                      placeholder="Bird species (e.g., crow, pigeon, eagle)"
                      value={query.bird}
                      onChange={(e) =>
                        updateTagQuery(index, "bird", e.target.value)
                      }
                      className="bird-input"
                      list="bird-suggestions"
                    />

                    {formData.searchType === "tags" && (
                      <input
                        type="number"
                        min="1"
                        max="100"
                        placeholder="Min count"
                        value={query.count}
                        onChange={(e) =>
                          updateTagQuery(
                            index,
                            "count",
                            parseInt(e.target.value) || 1
                          )
                        }
                        className="count-input"
                      />
                    )}

                    {formData.tagQueries.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeTagQuery(index)}
                        className="remove-query-btn"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={addTagQuery}
                className="add-query-btn"
              >
                + Add Another Bird Species
              </button>

              {/* Add refresh button */}
              <button
                type="button"
                onClick={discoverAvailableBirds}
                className="refresh-birds-btn"
                disabled={isLoadingBirds}
                style={{
                  marginLeft: "10px",
                  background: "#007bff",
                  color: "white",
                  border: "none",
                  padding: "8px 16px",
                  borderRadius: "4px",
                }}
              >
                🔄 Refresh Available Birds
              </button>

              {/* Use real database data instead of hardcoded birds */}
              <datalist id="bird-suggestions">
                {availableBirds.map((bird, index) => (
                  <option key={index} value={bird} />
                ))}
              </datalist>

              {formData.searchType === "tags" && (
                <div className="search-example">
                  <h4>Example:</h4>
                  <p>
                    Search for "crow: 2, pigeon: 1" will find files containing
                    at least 2 crows AND at least 1 pigeon.
                  </p>
                </div>
              )}

              {formData.searchType === "species" && (
                <div className="search-example">
                  <h4>Example:</h4>
                  <p>
                    Search for "crow" will find files containing any
                    number of crows OR pigeons.
                  </p>
                </div>
              )}
            </div>
          )}

          {formData.searchType === "url" && (
            <div className="url-search-section">
              <h3>Thumbnail URL Search</h3>
              <p>
                Enter a thumbnail URL to get the corresponding full-size image.
              </p>

              <input
                type="url"
                placeholder="https://bucket.s3.amazonaws.com/thumbnails/image_thumb.jpg"
                value={formData.thumbnailUrl}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    thumbnailUrl: e.target.value,
                  }))
                }
                className="url-input"
              />

              <div className="url-help">
                <h4>💡 How to get thumbnail URLs:</h4>
                <div className="url-steps">
                  <div className="url-step">
                    <span className="step-num">1</span>
                    <span>Use the tag or species search to find files</span>
                  </div>
                  <div className="url-step">
                    <span className="step-num">2</span>
                    <span>Right-click on any thumbnail in the results</span>
                  </div>
                  <div className="url-step">
                    <span className="step-num">3</span>
                    <span>
                      Select "Copy image address" or "Copy link address"
                    </span>
                  </div>
                  <div className="url-step">
                    <span className="step-num">4</span>
                    <span>Paste the URL here to get the full-size version</span>
                  </div>
                </div>

                <div className="url-note">
                  <strong>Note:</strong> This feature is useful when you have a
                  thumbnail URL from previous searches or shared links and want
                  to access the original high-resolution image.
                </div>
              </div>
            </div>
          )}

          {formData.searchType === "file" && (
            <div className="file-search-section">
              <h3>Upload File for Similarity Search</h3>
              <p>
                Upload a bird image, video, or audio file to find similar
                content in the database.
              </p>

              <div className="file-upload-area">
                <input
                  type="file"
                  accept="image/*,video/*,audio/*"
                  onChange={handleFileChange}
                  id="search-file-input"
                  className="file-input"
                />
                <label
                  htmlFor="search-file-input"
                  className="file-upload-label"
                >
                  {formData.uploadFile ? (
                    <div className="file-selected">
                      <span>📎 {formData.uploadFile.name}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({ ...prev, uploadFile: null }))
                        }
                        className="remove-file-btn"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div className="file-upload-placeholder">
                      <span>📁 Choose a file to analyze</span>
                      <small>Supported formats: JPG, PNG, MP4, MP3, WAV</small>
                    </div>
                  )}
                </label>
              </div>

              <div className="file-search-info">
                <h4>How File-based Search Works:</h4>
                <ol>
                  <li>Upload your bird image, video, or audio file</li>
                  <li>Our AI analyzes the file to detect bird species</li>
                  <li>
                    System searches for all files containing the same bird
                    species
                  </li>
                  <li>Results show files with matching bird tags</li>
                </ol>

                <div className="file-search-note">
                  <strong>Important:</strong> The uploaded file will not be
                  stored permanently in our system. It's only used for analysis
                  and finding similar content.
                </div>
              </div>
            </div>
          )}

          <div className="search-actions">
            <button
              onClick={handleSearch}
              disabled={!validateForm() || isSearching}
              className="search-btn"
            >
              {isSearching ? (
                <>
                  <span className="spinner"></span>
                  Searching...
                </>
              ) : (
                <>🔍 Search Files</>
              )}
            </button>

            {!validateForm() && (
              <div className="validation-help">
                <small>
                  {formData.searchType === "tags" ||
                  formData.searchType === "species"
                    ? "Please enter at least one bird species"
                    : formData.searchType === "url"
                    ? "Please enter a valid thumbnail URL"
                    : "Please select a file to upload"}
                </small>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchPage;