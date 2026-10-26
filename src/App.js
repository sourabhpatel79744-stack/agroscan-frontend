import React, { useState, useEffect, useRef } from "react";
import { predictDisease, fetchHistory } from "./api";

function LeafMark() {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
      <path
        d="M5 21C5 12 10 5 21 5C21 16 14 21 5 21Z"
        fill="#3C6E47"
      />
      <path d="M6.5 19.5L18 8" stroke="#F3ECD8" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function TopBar({ view, setView }) {
  return (
    <header className="topbar">
      <div className="brand">
        <LeafMark />
        <span>AgroScan</span>
      </div>
      <nav className="tabs">
        <button
          className={view === "scan" ? "tab active" : "tab"}
          onClick={() => setView("scan")}
        >
          स्कैन करें
        </button>
        <button
          className={view === "history" ? "tab active" : "tab"}
          onClick={() => setView("history")}
        >
          इतिहास
        </button>
      </nav>
    </header>
  );
}

function UploadView({ onResult }) {
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleFile = async (file) => {
    if (!file) return;
    setError(null);
    setPreview(URL.createObjectURL(file));
    setLoading(true);
    try {
      const result = await predictDisease(file);
      onResult(result, URL.createObjectURL(file));
    } catch (e) {
      setError(e.message);
      setLoading(false);
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    handleFile(file);
  };

  return (
    <div className="view">
      <div className="hero-copy">
        <h1>पत्ती की फोटो लें</h1>
        <p>अपनी फसल की पत्ती की तस्वीर अपलोड करें — तुरंत रोग की पहचान और सलाह पाएं</p>
      </div>

      <div
        className={`dropzone ${loading ? "dropzone-loading" : ""}`}
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        onClick={() => !loading && fileInputRef.current.click()}
      >
        {preview && (
          <img src={preview} alt="Selected leaf" className="preview-img" />
        )}

        {!preview && (
          <div className="dropzone-empty">
            <div className="dropzone-icon">🍃</div>
            <p className="dropzone-title">फोटो चुनें या यहां खींचें</p>
            <p className="dropzone-sub">JPG, PNG — कैमरा या गैलरी से</p>
          </div>
        )}

        {loading && (
          <div className="loading-overlay">
            <div className="spinner"></div>
            <p>विश्लेषण हो रहा है...</p>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          hidden
          onChange={(e) => handleFile(e.target.files[0])}
        />
      </div>

      {error && <div className="error-banner">{error}</div>}

      <button
        className="primary-btn"
        onClick={() => fileInputRef.current.click()}
        disabled={loading}
      >
        फोटो अपलोड करें
      </button>
    </div>
  );
}

function ResultView({ result, image, onBack }) {
  if (!result) return null;

  const isHealthy = result.predicted_class.toLowerCase().includes("healthy");

  return (
    <div className="view">
      <button className="back-link" onClick={onBack}>
        ← नई फोटो लें
      </button>

      <div className="result-card">
        <img src={image} alt="Scanned leaf" className="result-img" />

        <div className={`result-badge ${isHealthy ? "badge-healthy" : "badge-disease"}`}>
          {isHealthy ? "स्वस्थ पौधा" : "रोग मिला"}
        </div>

        <h2 className="result-disease-name">{result.disease_name_hindi}</h2>
        <p className="result-english-name">{result.disease_name_english}</p>

        <div className="confidence-row">
          <div className="confidence-bar-track">
            <div
              className="confidence-bar-fill"
              style={{ width: `${result.confidence}%` }}
            ></div>
          </div>
          <span className="confidence-label">{result.confidence}% विश्वास</span>
        </div>

        {!isHealthy && (
          <>
            <div className="advisory-block">
              <h3>सावधानियां</h3>
              <p>{result.precautions_hindi}</p>
            </div>
            <div className="advisory-block">
              <h3>उपचार</h3>
              <p>{result.treatment_hindi}</p>
            </div>
            <div className="advisory-block">
              <h3>ठीक होने का समय</h3>
              <p>{result.recovery_time_hindi}</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function HistoryView() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchHistory()
      .then((data) => {
        setHistory(data);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="view"><p className="muted">लोड हो रहा है...</p></div>;
  if (error) return <div className="view"><div className="error-banner">{error}</div></div>;

  return (
    <div className="view">
      <div className="hero-copy">
        <h1>स्कैन इतिहास</h1>
        <p>आपकी पिछली सभी जांच यहां देखें</p>
      </div>

      {history.length === 0 && (
        <p className="muted">अभी तक कोई स्कैन नहीं हुआ है।</p>
      )}

      <div className="history-list">
        {history.map((item) => {
          const isHealthy = item.predicted_class.toLowerCase().includes("healthy");
          const date = new Date(item.timestamp);
          return (
            <div className="history-item" key={item.scan_id}>
              <div className={`history-dot ${isHealthy ? "dot-healthy" : "dot-disease"}`}></div>
              <div className="history-info">
                <p className="history-name">{item.disease_name_hindi}</p>
                <p className="history-meta">
                  {item.confidence}% · {date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function App() {
  const [view, setView] = useState("scan");
  const [result, setResult] = useState(null);
  const [image, setImage] = useState(null);

  const handleResult = (res, img) => {
    setResult(res);
    setImage(img);
    setView("result");
  };

  const handleBack = () => {
    setResult(null);
    setImage(null);
    setView("scan");
  };

  return (
    <div className="app">
      <TopBar view={view === "result" ? "scan" : view} setView={(v) => { setView(v); setResult(null); }} />
      <main className="main">
        {view === "scan" && <UploadView onResult={handleResult} />}
        {view === "result" && <ResultView result={result} image={image} onBack={handleBack} />}
        {view === "history" && <HistoryView />}
      </main>
      <footer className="footer">AgroScan · कृषि सहायक</footer>
    </div>
  );
}
