import React, { useRef, useEffect, useState } from 'react';
import Tree from 'react-d3-tree';
import { NodeCard } from './node-card';
import { useTheme } from '../../context/ThemeContext';
import { ZoomIn, ZoomOut, Move } from 'lucide-react';

interface NetworkTreeDesktopProps {
  data: any;
}

export const NetworkTreeDesktop: React.FC<NetworkTreeDesktopProps> = ({ data }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const { theme } = useTheme();

  // Handle resize
  useEffect(() => {
    if (containerRef.current) {
      const { width, height } = containerRef.current.getBoundingClientRect();
      setDimensions({ width, height });
      setTranslate({ x: width / 2, y: 100 });
    }
  }, []);

  if (!data) return null;

  return (
    <div className="relative w-full h-[600px] bg-zinc-950 rounded-3xl border border-white/5 overflow-hidden shadow-2xl">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      {/* Controls */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-10">
        <button className="p-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg border border-white/10 shadow-lg transition-colors">
          <ZoomIn className="w-5 h-5" />
        </button>
        <button className="p-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg border border-white/10 shadow-lg transition-colors">
          <ZoomOut className="w-5 h-5" />
        </button>
        <button
          className="p-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg border border-white/10 shadow-lg transition-colors"
          onClick={() => setTranslate({ x: dimensions.width / 2, y: 100 })}
        >
          <Move className="w-5 h-5" />
        </button>
      </div>

      {/* Legend */}
      <div className="absolute top-4 left-4 bg-zinc-900/80 backdrop-blur-md p-3 rounded-xl border border-white/10 z-10">
        <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Ranks</h4>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-cyan-400"></div>
            <span className="text-xs text-zinc-300">Diamond</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
            <span className="text-xs text-zinc-300">Gold</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-slate-300"></div>
            <span className="text-xs text-zinc-300">Silver</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
            <span className="text-xs text-zinc-300">Member</span>
          </div>
        </div>
      </div>

      <div ref={containerRef} className="w-full h-full">
        {dimensions.width > 0 && (
          <Tree
            data={data}
            translate={translate}
            nodeSize={{ x: 250, y: 150 }}
            pathFunc="step"
            orientation="vertical"
            renderCustomNodeElement={(rd3tProps) => (
              <NodeCard {...rd3tProps} />
            )}
            zoomable={true}
            draggable={true}
            separation={{ siblings: 1, nonSiblings: 1.5 }}
            pathClassFunc={() => "stroke-zinc-700 stroke-2"}
          />
        )}
      </div>
    </div>
  );
};
