import React from 'react';
import { Backpack, ScrollText, MapPin, Save } from 'lucide-react';

interface SidebarProps {
  inventory: string[];
  quest: string;
  sceneTitle: string;
  onSave: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ inventory, quest, sceneTitle, onSave }) => {
  return (
    <div className="w-full md:w-80 bg-gray-900/90 border-r border-gray-800 p-6 flex flex-col h-full backdrop-blur-sm">
      <div className="flex-1 overflow-y-auto space-y-8 pr-2 custom-scrollbar">
        <div className="border-b border-gray-800 pb-6">
          <h2 className="text-xl font-bold text-yellow-500 flex items-center gap-2 font-serif mb-4">
            <MapPin className="w-5 h-5" /> Current Location
          </h2>
          <p className="text-gray-300 italic">{sceneTitle || "Unknown Lands"}</p>
        </div>

        <div className="border-b border-gray-800 pb-6">
          <h2 className="text-xl font-bold text-blue-400 flex items-center gap-2 font-serif mb-4">
            <ScrollText className="w-5 h-5" /> Current Quest
          </h2>
          <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700/50">
            <p className="text-gray-200 text-sm leading-relaxed">
              {quest || "Explore the world to find a purpose."}
            </p>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold text-emerald-400 flex items-center gap-2 font-serif mb-4">
            <Backpack className="w-5 h-5" /> Inventory
          </h2>
          {inventory.length === 0 ? (
            <p className="text-gray-500 text-sm italic">Your bag is empty.</p>
          ) : (
            <ul className="space-y-2">
              {inventory.map((item, idx) => (
                <li key={idx} className="flex items-center gap-3 bg-gray-800/30 p-3 rounded-lg border border-gray-700/30 hover:border-gray-600 transition-colors">
                  <div className="w-2 h-2 rounded-full bg-emerald-500/50" />
                  <span className="text-gray-300 text-sm">{item}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="pt-6 border-t border-gray-800 mt-4">
        <button 
          onClick={onSave}
          className="w-full flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-300 py-3 rounded-lg border border-gray-700 transition-colors"
        >
          <Save className="w-4 h-4" />
          <span>Save Game</span>
        </button>
      </div>
    </div>
  );
};