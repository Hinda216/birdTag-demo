// pages/NotificationsPage.tsx
import React, { useState, useEffect } from "react";
import "../styles/pagesCSS/NotificationPage.css";
import { DEMO } from '../demoMode';
import { demoApi } from '../demoApi';

interface NotificationSetting {
  id: string;
  birdSpecies: string;
  emailEnabled: boolean;
  createdDate: string;
  snsSubscriptionArn?: string;
}

const NotificationsPage: React.FC = () => {
  const [settings, setSettings] = useState<NotificationSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [newSpecies, setNewSpecies] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [availableBirds, setAvailableBirds] = useState<string[]>([]);
  const [isLoadingBirds, setIsLoadingBirds] = useState(true);

  useEffect(() => {
    loadUserEmail();
  }, []);

  useEffect(() => {
    if (DEMO || userEmail) {
      loadNotificationSettings();
    }
  }, [userEmail]);
  
  useEffect(() => {
  const discoverAvailableBirds = async () => {
    setIsLoadingBirds(true);

    // ✅ DEMO：从本地库聚合所有出现过的物种（来自 Tags/Upload）
    if (DEMO) {
      // @ts-ignore
      const files = await demoApi.listFiles();
      const speciesSet = new Set<string>();
      for (const f of files) {
        Object.keys(f.tags || {}).forEach(s => {
          if (s && typeof s === 'string') {
            const cap = s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
            speciesSet.add(cap);
          }
        });
      }

      // 加上历史缓存（如果有）
      const cached = JSON.parse(localStorage.getItem('birdnet_available_birds') || '[]');
      cached.forEach((b: string) => speciesSet.add(b));

      const birds = Array.from(speciesSet).sort();
      setAvailableBirds(birds);
      localStorage.setItem('birdnet_available_birds', JSON.stringify(birds));
      localStorage.setItem('birdnet_birds_discovered_at', new Date().toISOString());
      setIsLoadingBirds(false);
      return;
    }

    // ❄️ 非 DEMO：保留你原来的 AWS 探测逻辑
    try {
      const cached = localStorage.getItem("birdnet_available_birds");
      const discoveredAt = localStorage.getItem("birdnet_birds_discovered_at");
      if (cached && discoveredAt) {
        const cacheAge = Date.now() - new Date(discoveredAt).getTime();
        const oneDay = 24 * 60 * 60 * 1000;
        if (cacheAge < oneDay) {
          setAvailableBirds(JSON.parse(cached));
          setIsLoadingBirds(false);
          return;
        }
      }

      const commonBirds = ["Crow","Pigeon","Eagle","Sparrow","Robin","Owl","Hawk","Cardinal","Bluejay","Woodpecker","Duck","Goose","Swan","Falcon","Heron","Kingfisher","Magpie","Raven","Parrot","Dove","Finch","Wren"];
      const confirmed: string[] = [];

      for (const bird of commonBirds) {
        const res = await fetch(
          `https://0im62d1823.execute-api.us-east-1.amazonaws.com/dev/api/search?tag1=${encodeURIComponent(bird)}&count1=1`,
          { method: "GET", headers: { Authorization: `Bearer ${sessionStorage.getItem("idToken")}` } }
        );
        if (res.ok) {
          const data = await res.json();
          if (data.links && data.links.length > 0) confirmed.push(bird);
        }
        await new Promise(r => setTimeout(r, 300));
      }

      setAvailableBirds(confirmed.sort());
      localStorage.setItem("birdnet_available_birds", JSON.stringify(confirmed));
      localStorage.setItem("birdnet_birds_discovered_at", new Date().toISOString());
    } catch (err) {
      console.error("Failed to load birds", err);
    } finally {
      setIsLoadingBirds(false);
    }
  };

  discoverAvailableBirds();
}, []);


  const loadUserEmail = () => {
    // Get user email from JWT token or session storage
    const idToken = sessionStorage.getItem("idToken");
    if (idToken) {
      try {
        const tokenData = parseJwt(idToken);
        setUserEmail(tokenData.email || "");
      } catch (error) {
        console.error("Failed to parse user email from token:", error);
        setUserEmail("user@example.com"); // Fallback for demo
      }
    }
  };

  const parseJwt = (token: string) => {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split("")
        .map(function (c) {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join("")
    );
    return JSON.parse(jsonPayload);
  };

      const loadNotificationSettings = async () => {
        if (DEMO) {
          const s = await demoApi.notifications.get();
          setSettings(s.species.map((name, i) => ({
            id:`n${i+1}`, birdSpecies:name, emailEnabled:true, createdDate:new Date().toISOString()
          })));
          setLoading(false);
          return;
        }
        setLoading(true);
        try {
          if (!userEmail) {
            console.log("User email not available yet");
            setLoading(false);
            return;
          }

          const response = await fetch(
            `https://0im62d1823.execute-api.us-east-1.amazonaws.com/dev/api/notification/setting?email=${encodeURIComponent(userEmail)}`,
            {
              headers: {
                Authorization: `Bearer ${sessionStorage.getItem("idToken")}`,
              },
            }
          );

          if (response.ok) {
            const data = await response.json();
            setSettings(data.settings || []);
          } else {
            const errorText = await response.text();
            console.error("Server error:", errorText);
            alert("Failed to load notification settings from server.");
          }
        } catch (error) {
          console.error("Error loading notification settings:", error);
          alert("Error loading notification settings. Please try again later.");
        } finally {
          setLoading(false);
        }
      };


  const addSpeciesNotification = async () => {
    if (DEMO) {
      const s = await demoApi.notifications.add(newSpecies.toLowerCase());
      setSettings(s.species.map((name, i) => ({ id:`n${i+1}`, birdSpecies:name, emailEnabled:true, createdDate:new Date().toISOString() })));
      setNewSpecies('');
      alert('Added (demo)');
      return;
    }
    if (!newSpecies.trim()) {
      alert("Please enter a bird species");
      return;
    }

    if (!userEmail) {
      alert("Email address not found. Please ensure you are logged in.");
      return;
    }

    // Check if species already exists
    if (
      settings.some(
        (s) => s.birdSpecies.toLowerCase() === newSpecies.toLowerCase()
      )
    ) {
      alert("You already have notifications enabled for this species");
      return;
    }

    try {
      const response = await fetch("https://0im62d1823.execute-api.us-east-1.amazonaws.com/dev/api/notification/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionStorage.getItem("idToken")}`,
        },
        body: JSON.stringify({
          species: newSpecies.toLowerCase(),
          email: userEmail,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to add notification");
      }

      const responseData = await response.json();

      const newSetting: NotificationSetting = {
        id: responseData.subscriptionId || Date.now().toString(),
        birdSpecies: newSpecies.toLowerCase(),
        emailEnabled: true,
        createdDate: new Date().toISOString(),
        snsSubscriptionArn: responseData.subscriptionArn,
      };

      setSettings((prev) => [...prev, newSetting]);
      setNewSpecies("");
      alert(`Email notifications enabled for "${newSpecies}"!`);
    } catch (error) {
      console.error("Error adding notification:", error);
      alert(
        `Failed to add notification: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  const removeSpeciesNotification = async (settingId: string) => {
    if (DEMO) {
      const setting = settings.find(s => s.id === settingId);
      if (!setting) return;
      const s = await demoApi.notifications.remove(setting.birdSpecies);
      setSettings(s.species.map((name, i) => ({ id:`n${i+1}`, birdSpecies:name, emailEnabled:true, createdDate:new Date().toISOString() })));
      alert(`Notification removed for ${setting?.birdSpecies} (demo)`);
      return;
    }

    const setting = settings.find((s) => s.id === settingId);
    if (!setting) return;

    if (!confirm(`Remove email notifications for ${setting.birdSpecies}?`)) {
      return;
    }

    try {
      const response = await fetch("https://0im62d1823.execute-api.us-east-1.amazonaws.com/dev/api/notification/unsubscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionStorage.getItem("idToken")}`,
        },
        body: JSON.stringify({
          species: setting.birdSpecies,
          email: userEmail,
          subscriptionArn: setting.snsSubscriptionArn,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to remove notification");
      }

      setSettings((prev) => prev.filter((s) => s.id !== settingId));
      alert(`Notification removed for ${setting.birdSpecies}`);
    } catch (error) {
      console.error("Error removing notification:", error);
      alert(
        `Failed to remove notification: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-container">
          <div className="spinner-large"></div>
          <p>Loading notification settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* page head */}
      <div className="notifications-header">
        <h1>🔔 Email Notifications</h1>
        <p>
          Get automatic email alerts when new bird media files are uploaded to
          the system.
        </p>
        {userEmail && (
          <div className="user-email-info">
            <p>
              <strong>📧 Notifications will be sent to:</strong> {userEmail}
            </p>
          </div>
        )}
      </div>

      {/* use guide */}
      <div className="instructions-section">
        <h2>📖 How Email Notifications Work</h2>
        <div className="instruction-steps">
          <div className="step">
            <div className="step-number">1</div>
            <div className="step-content">
              <h4>Choose Bird Species</h4>
              <p>
                Add the bird species you're interested in to receive
                notifications about new uploads containing those species.
              </p>
            </div>
          </div>
          <div className="step">
            <div className="step-number">2</div>
            <div className="step-content">
              <h4>Automatic Detection</h4>
              <p>
                When new images, videos, or audio files are uploaded, our AI
                system automatically detects bird species.
              </p>
            </div>
          </div>
          <div className="step">
            <div className="step-number">3</div>
            <div className="step-content">
              <h4>Get Notified</h4>
              <p>
                If the uploaded files contain your subscribed species, you'll
                receive an email with details about the new content.
              </p>
            </div>
          </div>
        </div>

        <div className="notification-features">
          <h4>🌟 Notification Features</h4>
          <div className="features-grid">
            <div className="feature-item">
              <span className="feature-icon">🎯</span>
              <div>
                <strong>Species-Specific</strong>
                <p>Only get alerts for the bird species you care about</p>
              </div>
            </div>
            <div className="feature-item">
              <span className="feature-icon">⚡</span>
              <div>
                <strong>Real-time Alerts</strong>
                <p>Receive notifications as soon as new files are processed</p>
              </div>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🔧</span>
              <div>
                <strong>Fully Customizable</strong>
                <p>
                  Enable/disable notifications for individual species anytime
                </p>
              </div>
            </div>
            <div className="feature-item">
              <span className="feature-icon">📊</span>
              <div>
                <strong>Detailed Information</strong>
                <p>Get file details, detection confidence, and direct links</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* add new notification */}
      <div className="add-notification-section">
        <h2>➕ Subscribe to Bird Species</h2>
        <p>
          Enter a bird species below to start receiving email notifications when
          new files containing that species are uploaded.
        </p>

        <div className="add-species-form-container">
          <div className="add-species-form">
            <input
              type="text"
              placeholder="Enter bird species (e.g., eagle, hawk, robin)"
              value={newSpecies}
              onChange={(e) => setNewSpecies(e.target.value)}
              className="species-input"
              list="species-suggestions"
            />
            <button
              onClick={addSpeciesNotification}
              className="add-species-btn"
              disabled={!newSpecies.trim() || !userEmail}
            >
              🔔 Add Notification
            </button>
          </div>

          <datalist id="species-suggestions">
            {availableBirds.map((bird, index) => (
              <option key={index} value={bird} />
            ))}
          </datalist>

          <div className="popular-species">
            <p>
              <strong>Popular choices:</strong> {availableBirds.slice(0, 5).join(", ")}
            </p>
          </div>
        </div>
      </div>

      {/* manage notification */}
      <div className="manage-notifications-section">
        <div className="section-header">
          <h2>Your Active Subscriptions</h2>
          <p>
            {settings.length === 0
              ? "No species notifications configured yet. Add your first subscription above!"
              : `You have ${settings.length} active subscriptions.`}
          </p>
        </div>

        <div className="species-list">
          {settings.length === 0 ? (
            <div className="no-settings">
              <div className="no-settings-icon">🔔</div>
              <h3>No Notifications Set Up</h3>
              <p>
                Start by adding a bird species above to receive your first email
                notifications!
              </p>
              <div className="suggested-actions">
                <p>
                  <strong>Suggested species to get started:</strong>
                </p>
                <div className="quick-add-buttons">
                  {["eagle", "hawk", "owl", "robin"].map((species) => (
                    <button
                      key={species}
                      onClick={() => setNewSpecies(species)}
                      className="quick-add-btn"
                    >
                      🐦 {species}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            settings.map((setting) => (
              <div key={setting.id} className="species-item">
                <div className="species-info">
                  <div className="species-main">
                    <span className="species-name">
                      🐦 {setting.birdSpecies}
                    </span>
                    <span className="status-badge active">✅ Active</span>
                  </div>
                  <span className="created-date">
                    Added {formatDate(setting.createdDate)}
                  </span>
                </div>

                <div className="species-actions">
                  <button
                    onClick={() => removeSpeciesNotification(setting.id)}
                    className="remove-species-btn"
                    title={`Remove notifications for ${setting.birdSpecies}`}
                  >
                    🗑️ Remove
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* statistics */}
        {settings.length > 0 && (
          <div className="notifications-stats">
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-number">{settings.length}</span>
                <span className="stat-label">Total Subscriptions</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
