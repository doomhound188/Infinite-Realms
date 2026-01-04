import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatWidget } from './components/ChatWidget';
import { ApiKeyModal } from './components/ApiKeyModal';
import { generateStorySegment, generateSceneImage, checkHasKey } from './services/geminiService';
import { ImageSize, HistoryItem, Choice, GameState } from './types';
import { Play, Loader2, Image as ImageIcon, Save, Download } from 'lucide-react';

const App: React.FC = () => {
  const [started, setStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [imgLoading, setImgLoading] = useState(false);
  
  // Game State
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [currentText, setCurrentText] = useState("");
  const [choices, setChoices] = useState<Choice[]>([]);
  const [inventory, setInventory] = useState<string[]>([]);
  const [quest, setQuest] = useState("");
  const [sceneTitle, setSceneTitle] = useState("");
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [charDesc, setCharDesc] = useState("A mysterious traveler in worn clothes.");
  
  // Settings & System
  const [imageSize, setImageSize] = useState<ImageSize>(ImageSize.Size_1K);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [pendingPrompt, setPendingPrompt] = useState<string | null>(null);
  const [hasSave, setHasSave] = useState(false);

  // Initial load
  useEffect(() => {
    // Check key
    checkHasKey();
    // Check save
    const saved = localStorage.getItem('infinite_realms_save');
    if (saved) setHasSave(true);
  }, []);

  const saveGame = () => {
    const state: GameState = {
      history,
      currentText,
      choices,
      inventory,
      quest,
      sceneTitle,
      currentImage,
      charDesc,
      started,
      imageSize,
      savedAt: Date.now()
    };
    try {
      localStorage.setItem('infinite_realms_save', JSON.stringify(state));
      setHasSave(true);
      // Optional: Visual feedback could be added here
      alert("Game Saved Successfully"); 
    } catch (e) {
      console.error("Failed to save game", e);
      alert("Failed to save game. Storage might be full.");
    }
  };

  const loadGame = () => {
    try {
      const saved = localStorage.getItem('infinite_realms_save');
      if (saved) {
        const state = JSON.parse(saved) as GameState;
        setHistory(state.history);
        setCurrentText(state.currentText);
        setChoices(state.choices);
        setInventory(state.inventory);
        setQuest(state.quest);
        setSceneTitle(state.sceneTitle);
        setCurrentImage(state.currentImage);
        setCharDesc(state.charDesc);
        setImageSize(state.imageSize || ImageSize.Size_1K);
        setStarted(true); // Jump straight in
      }
    } catch (e) {
      console.error("Failed to load game", e);
    }
  };

  const handleGameStep = async (choiceText: string) => {
    setLoading(true);
    try {
      // 1. Generate Text (Fast Lite Model)
      const result = await generateStorySegment(history, choiceText, inventory, quest, charDesc);
      
      // Update State
      setCurrentText(result.storyText);
      setChoices(result.choices);
      setSceneTitle(result.sceneTitle);
      
      // Inventory updates
      if (result.inventoryUpdates) {
        setInventory(prev => {
          const next = [...prev];
          result.inventoryUpdates.add?.forEach((item: string) => next.push(item));
          result.inventoryUpdates.remove?.forEach((item: string) => {
            const idx = next.indexOf(item);
            if (idx > -1) next.splice(idx, 1);
          });
          return next;
        });
      }

      // Quest update
      if (result.newQuest) {
        setQuest(result.newQuest);
      }
      
      // Character update
      if (result.characterVisualUpdate) {
        setCharDesc(result.characterVisualUpdate);
      }

      // 2. Trigger Image Generation
      // Check for key first
      const hasKey = await checkHasKey();
      if (!hasKey) {
          setPendingPrompt(result.imagePrompt);
          setShowKeyModal(true);
      } else {
          generateImage(result.imagePrompt);
      }

    } catch (error) {
      console.error("Game loop error", error);
      setCurrentText("The mists of time swirl... something went wrong. Try again.");
    } finally {
      setLoading(false);
      setStarted(true);
    }
  };

  const generateImage = async (prompt: string) => {
    setImgLoading(true);
    try {
      const b64 = await generateSceneImage(prompt, imageSize);
      if (b64) setCurrentImage(b64);
    } catch (e: any) {
        if (e.message === "API_KEY_MISSING" || e.message === "API_KEY_INVALID") {
             setPendingPrompt(prompt);
             setShowKeyModal(true);
        }
        console.error("Image generation failed", e);
    } finally {
      setImgLoading(false);
    }
  };

  const handleKeySuccess = () => {
      setShowKeyModal(false);
      if (pendingPrompt) {
          generateImage(pendingPrompt);
          setPendingPrompt(null);
      }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-950 text-gray-100 overflow-hidden">
      
      {/* Sidebar (Desktop: Left, Mobile: Hidden/Top) */}
      <div className="hidden md:block h-full shrink-0 z-10">
        <Sidebar inventory={inventory} quest={quest} sceneTitle={sceneTitle} onSave={saveGame} />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full relative overflow-hidden">
        
        {/* Top Bar for Image Settings & Mobile Controls */}
        <div className="absolute top-0 right-0 p-4 z-20 flex gap-2">
            {started && (
              <button 
                onClick={saveGame}
                className="bg-gray-900/80 backdrop-blur rounded-lg border border-gray-700 p-2 hover:bg-gray-800 text-gray-300 transition-colors"
                title="Save Game"
              >
                <Save className="w-4 h-4" />
              </button>
            )}
            <div className="bg-gray-900/80 backdrop-blur rounded-lg border border-gray-700 p-1 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 ml-2 text-gray-400" />
                <select 
                    value={imageSize} 
                    onChange={(e) => setImageSize(e.target.value as ImageSize)}
                    className="bg-transparent border-none text-xs font-bold text-gray-300 focus:ring-0 cursor-pointer"
                >
                    <option value={ImageSize.Size_1K}>1K</option>
                    <option value={ImageSize.Size_2K}>2K (Pro)</option>
                    <option value={ImageSize.Size_4K}>4K (Pro)</option>
                </select>
            </div>
        </div>

        {/* Visual Layer */}
        <div className="h-[40vh] md:h-[50vh] w-full bg-gray-900 relative border-b border-gray-800">
           {currentImage ? (
               <img 
                 src={currentImage} 
                 alt="Scene" 
                 className={`w-full h-full object-cover transition-opacity duration-1000 ${imgLoading ? 'opacity-80 blur-sm' : 'opacity-100'}`}
               />
           ) : (
               <div className="w-full h-full flex items-center justify-center bg-gray-900 text-gray-700">
                   <div className="text-center">
                       <p className="font-serif italic text-2xl mb-2">Infinite Realms</p>
                       <p className="text-sm">Your visual journey awaits...</p>
                   </div>
               </div>
           )}
           
           {imgLoading && (
               <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm">
                   <div className="bg-gray-900/80 px-4 py-2 rounded-full flex items-center gap-2 border border-gray-700">
                       <Loader2 className="w-4 h-4 animate-spin text-yellow-500" />
                       <span className="text-xs font-bold text-yellow-500">Generating Vision...</span>
                   </div>
               </div>
           )}
        </div>

        {/* Text & Gameplay Layer */}
        <div className="flex-1 overflow-y-auto bg-gray-950 p-6 md:p-12 max-w-4xl mx-auto w-full">
            {!started ? (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-8">
                    <h1 className="text-5xl md:text-7xl font-serif text-transparent bg-clip-text bg-gradient-to-br from-yellow-400 to-yellow-700 drop-shadow-lg">
                        Infinite Realms
                    </h1>
                    <p className="text-xl text-gray-400 max-w-lg mx-auto">
                        An endless journey crafted by AI. Every choice matters. Every scene is unique.
                    </p>
                    <div className="flex flex-col gap-4 w-full max-w-xs mx-auto">
                      <button 
                          onClick={() => handleGameStep("")}
                          disabled={loading}
                          className="group relative px-8 py-4 bg-yellow-600 hover:bg-yellow-500 text-black font-bold text-xl rounded-xl transition-all shadow-[0_0_20px_rgba(202,138,4,0.3)] hover:shadow-[0_0_30px_rgba(202,138,4,0.5)] flex items-center justify-center gap-3"
                      >
                          {loading ? <Loader2 className="animate-spin" /> : <Play className="fill-black" />}
                          Begin Adventure
                      </button>
                      
                      {hasSave && (
                        <button
                          onClick={loadGame}
                          className="px-8 py-3 bg-gray-800 hover:bg-gray-700 text-gray-200 font-bold rounded-xl border border-gray-700 transition-colors flex items-center justify-center gap-2"
                        >
                          <Download className="w-4 h-4" /> Load Saved Game
                        </button>
                      )}
                    </div>
                </div>
            ) : (
                <div className="space-y-8 pb-20">
                    <div className="prose prose-invert prose-lg max-w-none">
                        <p className="leading-relaxed text-gray-200 font-serif text-xl md:text-2xl drop-shadow-sm">
                            {currentText}
                        </p>
                    </div>

                    {loading ? (
                         <div className="py-8 text-center text-gray-500 animate-pulse flex justify-center gap-2">
                            <span className="w-2 h-2 bg-gray-600 rounded-full animate-bounce"></span>
                            <span className="w-2 h-2 bg-gray-600 rounded-full animate-bounce delay-75"></span>
                            <span className="w-2 h-2 bg-gray-600 rounded-full animate-bounce delay-150"></span>
                        </div>
                    ) : (
                        <div className="grid gap-4 pt-8">
                            {choices.map((choice) => (
                                <button
                                    key={choice.id}
                                    onClick={() => handleGameStep(choice.text)}
                                    className="w-full text-left p-6 rounded-xl border border-gray-800 bg-gray-900/50 hover:bg-gray-800 hover:border-yellow-600/50 transition-all group flex items-start gap-4"
                                >
                                    <span className="mt-1 w-2 h-2 rounded-full bg-gray-600 group-hover:bg-yellow-500 transition-colors" />
                                    <span className="text-lg text-gray-300 group-hover:text-yellow-100 transition-colors font-medium">
                                        {choice.text}
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>

      </div>

      <ChatWidget contextSummary={`Current Scene: ${sceneTitle}. Quest: ${quest}. Inventory: ${inventory.join(", ")}`} />
      
      {showKeyModal && <ApiKeyModal onSuccess={handleKeySuccess} />}
    </div>
  );
};

export default App;