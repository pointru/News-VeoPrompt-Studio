
import React, { useState, useRef, useEffect } from 'react';
import { OutputMode, MultimediaSource, ProjectOutput } from './types';
import { generateNewsPrompts } from './services/geminiService';

const App: React.FC = () => {
  const [textInput, setTextInput] = useState('');
  const [image, setImage] = useState<MultimediaSource | null>(null);
  const [video, setVideo] = useState<MultimediaSource | null>(null);
  const [mode, setMode] = useState<OutputMode>(OutputMode.JSON);
  const [result, setResult] = useState('');
  const [parsedResult, setParsedResult] = useState<ProjectOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState<{ text?: string; media?: string }>({});
  const [darkMode, setDarkMode] = useState(false);
  const [copyStatus, setCopyStatus] = useState<number | string | null>(null);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('class', 'dark');
    else document.documentElement.classList.remove('dark');
  }, [darkMode]);

  useEffect(() => {
    if (result && mode === OutputMode.JSON) {
      try {
        const cleaned = result.replace(/```json|```/g, '').trim();
        const parsed = JSON.parse(cleaned);
        setParsedResult(parsed);
      } catch (e) {
        console.error("Parsing error", e);
        setParsedResult(null);
      }
    } else {
      setParsedResult(null);
    }
  }, [result, mode]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
    const file = e.target.files?.[0];
    if (file) {
      // Basic size validation (e.g., max 20MB)
      if (file.size > 20 * 1024 * 1024) {
        setValidationErrors(prev => ({ ...prev, media: 'File too large. Maximum size is 20MB.' }));
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === 'image') {
          setImage({ data: reader.result as string, mimeType: file.type });
          setVideo(null); // Clear video if image is uploaded
        } else {
          setVideo({ data: reader.result as string, mimeType: file.type });
          setImage(null); // Clear image if video is uploaded
        }
        setValidationErrors(prev => ({ ...prev, media: undefined }));
      };
      reader.readAsDataURL(file);
    }
  };

  const copyToClipboard = (text: string, id: number | string) => {
    navigator.clipboard.writeText(text);
    setCopyStatus(id);
    setTimeout(() => setCopyStatus(null), 2000);
  };

  const formatClipForCopy = (clip: any) => {
    return `PROGRAM: ${parsedResult?.program_name || 'BEDAH BERITA'}\n` +
           `TITLE: ${parsedResult?.project_title || 'I2V Production'}\n` +
           `CLIP ID: ${clip.clip_id}\n` +
           `TONE: ${clip.tone_of_voice}\n` +
           `DIALOGUE: ${clip.dialogue}\n` +
           `VISUAL ACTION: ${clip.visual_action}\n` +
           `INSERT POINT: ${clip.insert_point.time} - ${clip.insert_point.position} (${clip.insert_point.content})\n\n` +
           `VEO 3 PROMPT:\n${clip.veo3_prompt}`;
  };

  const validateInputs = (): boolean => {
    const errors: { text?: string; media?: string } = {};
    let isValid = true;

    // Must have at least something to work with
    if (!textInput.trim() && !image && !video) {
      errors.text = 'Please provide a news script or upload a source media.';
      errors.media = 'Source media is missing.';
      isValid = false;
    }

    // If text is provided, it should be at least somewhat meaningful
    if (textInput.trim() && textInput.trim().length < 20 && !image && !video) {
      errors.text = 'The script is too short to generate high-quality news clips (min 20 chars).';
      isValid = false;
    }

    setValidationErrors(errors);
    return isValid;
  };

  const handleGenerate = async () => {
    if (!validateInputs()) return;

    setIsLoading(true);
    setError('');
    setResult('');
    try {
      const output = await generateNewsPrompts({ text: textInput, image: image || undefined, video: video || undefined, mode });
      setResult(output);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred during generation.');
    } finally {
      setIsLoading(false);
    }
  };

  const clearInputs = () => {
    setTextInput('');
    setImage(null);
    setVideo(null);
    setValidationErrors({});
    setResult('');
    setParsedResult(null);
    setError('');
  };

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      <header className={`py-4 px-6 border-b flex justify-between items-center sticky top-0 z-50 transition-colors ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#800000] rounded-lg flex items-center justify-center shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h1 className={`text-xl font-black uppercase tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>IWAN ENGINE <span className="text-[#800000]">I2V</span></h1>
            <p className="text-[10px] font-bold text-slate-500 tracking-widest uppercase">Director AI: Frame-to-Video</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          { (textInput || image || video) && (
            <button onClick={clearInputs} className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-[#800000] transition-colors mr-4">Reset</button>
          )}
          <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 hover:scale-105 transition-transform">
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Control Panel */}
        <div className="lg:col-span-4 space-y-6">
          <div className={`border rounded-3xl p-6 shadow-xl transition-colors ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} ${validationErrors.media ? 'border-red-500 shadow-red-500/10' : ''}`}>
            <h2 className={`text-[10px] font-black mb-4 uppercase tracking-widest ${validationErrors.media ? 'text-red-500' : 'text-[#800000]'}`}>Input Multimedia</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => imageInputRef.current?.click()} 
                  className={`p-4 border-2 border-dashed rounded-2xl flex flex-col items-center gap-1 transition-all ${image ? 'bg-maroon-50 border-[#800000]' : validationErrors.media ? 'border-red-300' : 'border-slate-200 dark:border-slate-800 hover:border-[#800000]'}`}
                >
                  <span className="text-xl">{image ? '✅' : '📷'}</span>
                  <span className="text-[9px] font-black uppercase tracking-tighter">I2V Analysis</span>
                  <input type="file" ref={imageInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'image')} />
                </button>
                <button 
                  onClick={() => videoInputRef.current?.click()} 
                  className={`p-4 border-2 border-dashed rounded-2xl flex flex-col items-center gap-1 transition-all ${video ? 'bg-maroon-50 border-[#800000]' : validationErrors.media ? 'border-red-300' : 'border-slate-200 dark:border-slate-800 hover:border-[#800000]'}`}
                >
                  <span className="text-xl">{video ? '✅' : '🎥'}</span>
                  <span className="text-[9px] font-black uppercase tracking-tighter">Transcribe</span>
                  <input type="file" ref={videoInputRef} className="hidden" accept="video/*" onChange={(e) => handleFileUpload(e, 'video')} />
                </button>
              </div>
              {validationErrors.media && <p className="text-[9px] font-bold text-red-500 uppercase tracking-widest mt-1 text-center">{validationErrors.media}</p>}

              <div className="relative">
                <div className="flex justify-between items-center mb-2 px-1">
                  <label className={`text-[9px] font-black uppercase tracking-widest block ${validationErrors.text ? 'text-red-500' : 'text-slate-400'}`}>Source Script / Manual Text</label>
                  <span className={`text-[9px] font-bold ${textInput.length < 20 ? 'text-slate-400' : 'text-emerald-500'}`}>{textInput.length} chars</span>
                </div>
                <textarea
                  className={`w-full h-40 rounded-2xl p-4 text-xs font-medium focus:ring-2 focus:ring-[#800000] outline-none transition-all resize-none ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'} ${validationErrors.text ? 'border-red-500 focus:ring-red-500' : ''}`}
                  placeholder="Paste news content here... (at least 20 chars for better results)"
                  value={textInput}
                  onChange={(e) => {
                    setTextInput(e.target.value);
                    if (validationErrors.text) setValidationErrors(prev => ({ ...prev, text: undefined }));
                  }}
                />
                {validationErrors.text && <p className="text-[9px] font-bold text-red-500 uppercase tracking-widest mt-2 px-1">{validationErrors.text}</p>}
              </div>

              <button 
                onClick={handleGenerate} 
                disabled={isLoading} 
                className={`w-full py-4 bg-[#800000] text-white font-black rounded-2xl shadow-lg uppercase text-xs hover:bg-[#600000] active:scale-[0.98] transition-all disabled:opacity-50`}
              >
                {isLoading ? 'CALCULATING I2V PLAN...' : 'GENERATE ADAPTIVE CLIPS'}
              </button>
              {error && <p className="text-red-500 text-[10px] font-bold text-center uppercase animate-pulse">{error}</p>}
            </div>
          </div>
          
          <div className={`p-4 rounded-2xl border text-[10px] font-medium leading-relaxed ${darkMode ? 'bg-slate-900 border-slate-800 opacity-60' : 'bg-blue-50 border-blue-100 text-blue-800'}`}>
            <p className="font-black uppercase mb-1">💡 I2V Rule:</p>
            The engine automatically avoids physical descriptions to maintain image consistency. It only generates motion and expressions. Best results with > 20 chars script.
          </div>
        </div>

        {/* Right: Output Engine */}
        <div className="lg:col-span-8 flex flex-col space-y-4">
          <div className="flex justify-between items-center px-2">
            <div>
              <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#800000]">
                {parsedResult ? parsedResult.program_name : 'Director Console'}
              </h2>
              {parsedResult && <p className="text-[14px] font-black truncate max-w-md">{parsedResult.project_title}</p>}
            </div>
            {result && (
              <button 
                onClick={() => copyToClipboard(result, 'all')}
                className={`text-[9px] font-black uppercase px-4 py-1.5 rounded-full border shadow-sm transition-all ${copyStatus === 'all' ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-slate-200 dark:bg-slate-800 border-transparent hover:bg-slate-300 dark:hover:bg-slate-700'}`}
              >
                {copyStatus === 'all' ? 'All Copied!' : 'Copy Entire JSON'}
              </button>
            )}
          </div>

          <div className={`flex-1 rounded-3xl border overflow-auto p-6 transition-colors ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-2xl'}`}>
            {!result && !isLoading ? (
              <div className="h-full flex flex-col items-center justify-center opacity-20 text-slate-400 gap-3">
                <span className="text-5xl">🎭</span>
                <p className="text-[10px] font-black uppercase tracking-[0.4em]">Ready for Production</p>
              </div>
            ) : isLoading ? (
              <div className="h-full flex flex-col items-center justify-center gap-6">
                <div className="relative">
                  <div className="w-14 h-14 border-4 border-[#800000]/20 rounded-full"></div>
                  <div className="absolute top-0 w-14 h-14 border-4 border-[#800000] border-t-transparent rounded-full animate-spin"></div>
                </div>
                <div className="text-center space-y-1">
                  <p className="text-[#800000] text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">Analyzing News Structure</p>
                  <p className="text-slate-400 text-[8px] font-bold uppercase tracking-widest">Applying Symmetry Loop Logic</p>
                </div>
              </div>
            ) : parsedResult ? (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* News Points */}
                <div className="p-5 bg-maroon-50 dark:bg-maroon-900/10 rounded-2xl border border-maroon-100 dark:border-maroon-900/20">
                  <div className="flex items-center gap-2 mb-3">
                     <span className="w-2 h-2 bg-[#800000] rounded-full"></span>
                     <h3 className="text-[#800000] text-xs font-black uppercase tracking-wide">Key News Insights</h3>
                  </div>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {parsedResult.summary_points?.map((p, i) => (
                      <li key={i} className="text-[11px] font-medium leading-relaxed opacity-80 flex gap-2">
                        <span className="text-[#800000] font-black">›</span> {p}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Clips Timeline */}
                <div className="space-y-6">
                  {parsedResult.clips.map((clip, idx) => {
                    const isLast = idx === parsedResult.clips.length - 1;
                    return (
                      <div key={idx} className={`group rounded-3xl border overflow-hidden transition-all duration-300 ${darkMode ? 'bg-slate-950 border-slate-800 hover:border-[#800000]/50' : 'bg-slate-50 border-slate-200 hover:shadow-lg'}`}>
                        {/* Clip Header */}
                        <div className={`px-6 py-4 border-b flex justify-between items-center transition-colors ${darkMode ? 'bg-slate-900/40 border-slate-800 group-hover:bg-slate-900/60' : 'bg-white border-slate-100 group-hover:bg-slate-50'}`}>
                          <div className="flex items-center gap-4">
                            <div className="flex flex-col">
                              <span className="text-[10px] font-black text-[#800000] uppercase tracking-tighter">Sequence</span>
                              <span className="text-xl font-black italic">#{clip.clip_id}</span>
                            </div>
                            <div className="h-8 w-[1px] bg-slate-200 dark:bg-slate-800 mx-2"></div>
                            <div className="flex flex-col">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Duration</span>
                              <span className="text-xs font-bold">{clip.duration}</span>
                            </div>
                            {isLast && <span className="text-[9px] font-black bg-emerald-500 text-white px-2 py-0.5 rounded ml-2 uppercase">Outro</span>}
                          </div>
                          
                          <button 
                            onClick={() => copyToClipboard(formatClipForCopy(clip), clip.clip_id)}
                            className={`text-[9px] font-black px-6 py-2.5 rounded-full shadow-sm transition-all border uppercase flex items-center gap-2 ${
                              copyStatus === clip.clip_id 
                                ? 'bg-emerald-500 text-white border-emerald-500' 
                                : 'bg-white dark:bg-slate-800 text-[#800000] border-[#800000] hover:bg-[#800000] hover:text-white'
                            }`}
                          >
                            {copyStatus === clip.clip_id ? '✓ Data Copied' : 'Copy All Clip Data'}
                          </button>
                        </div>
                        
                        <div className="p-6 space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Dialogue & Tone */}
                            <div className="space-y-4">
                              <div className="bg-white dark:bg-black/20 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-inner">
                                <div className="flex justify-between items-center mb-2">
                                  <span className="text-[8px] font-black text-[#800000] uppercase tracking-widest">Dubbing & Tone</span>
                                  <span className="text-[9px] font-black px-2 py-0.5 bg-[#800000]/10 text-[#800000] rounded uppercase">{clip.tone_of_voice}</span>
                                </div>
                                <p className="text-sm font-bold italic leading-relaxed text-slate-700 dark:text-slate-200">"{clip.dialogue}"</p>
                              </div>
                              <div className="px-1">
                                <p className="text-[8px] font-black text-slate-400 uppercase mb-2 tracking-widest">Visual Direction</p>
                                <p className="text-[11px] font-medium opacity-90 leading-relaxed">{clip.visual_action}</p>
                              </div>
                            </div>

                            {/* Camera & Insert */}
                            <div className="space-y-4">
                              <div className="px-1">
                                <p className="text-[8px] font-black text-slate-400 uppercase mb-2 tracking-widest">Camera Motion</p>
                                <p className="text-[10px] font-mono opacity-80 bg-slate-200 dark:bg-slate-900 p-2 rounded-lg">{clip.camera_logic || 'Standard Symmetry Loop'}</p>
                              </div>
                              <div className="p-4 bg-[#800000]/5 dark:bg-[#800000]/10 rounded-2xl border border-[#800000]/10">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-[8px] font-black text-[#800000] uppercase tracking-widest">Editor Overlay</span>
                                  <span className="text-[9px] font-black opacity-60 uppercase">{clip.insert_point.time}</span>
                                </div>
                                <p className="text-[11px] font-bold"><span className="opacity-50 font-medium">Content:</span> {clip.insert_point.content}</p>
                                <p className="text-[9px] mt-1 opacity-60 italic">Position: {clip.insert_point.position}</p>
                              </div>
                            </div>
                          </div>
                          
                          {/* Final Prompt */}
                          <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                            <div className="flex justify-between items-center mb-3">
                               <p className="text-[8px] font-black text-blue-500 uppercase tracking-widest flex items-center gap-2">
                                 <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                                 Veo 3 Engine Prompt
                               </p>
                               <button onClick={() => copyToClipboard(clip.veo3_prompt, `p${clip.clip_id}`)} className="text-[8px] font-bold opacity-40 hover:opacity-100 uppercase tracking-widest">Copy Prompt Only</button>
                            </div>
                            <div className={`p-4 rounded-2xl border font-mono text-[10px] leading-relaxed transition-colors ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-slate-900 text-slate-300 border-slate-800'}`}>
                              {clip.veo3_prompt}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <pre className="text-[10px] font-mono whitespace-pre-wrap leading-relaxed opacity-70 bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800">{result}</pre>
            )}
          </div>
          
          <div className="flex justify-between items-center px-4 text-[8px] font-black text-slate-400 uppercase tracking-widest">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 bg-[#800000] rounded-sm rotate-45"></span>
              © IWAN ENGINE I2V SYSTEM
            </span>
            <div className="flex gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                Symmetry Loop Engaged
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></span>
                Negative Space Optimized
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
