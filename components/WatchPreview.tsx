import React from 'react';
import { ZeppWidget, WidgetType } from '../types';
import { Mic, CheckSquare, Square } from 'lucide-react';

interface WatchPreviewProps {
  widgets: ZeppWidget[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const WatchPreview: React.FC<WatchPreviewProps> = ({ widgets, selectedId, onSelect }) => {
  
  const renderWidget = (widget: ZeppWidget) => {
    const { x, y, w, h, color, text, text_size, normal_color, radius } = widget.props;
    
    const isSelected = selectedId === widget.id;
    const borderClass = isSelected ? 'ring-2 ring-blue-500' : '';

    const commonStyle: React.CSSProperties = {
        position: 'absolute',
        left: `${x}px`,
        top: `${y}px`,
        width: `${w}px`,
        height: `${h}px`,
        zIndex: isSelected ? 50 : 10,
    };

    switch (widget.type) {
      case WidgetType.TEXT:
        return (
          <div 
            key={widget.id}
            onClick={(e) => { e.stopPropagation(); onSelect(widget.id); }}
            className={`flex items-center justify-center cursor-pointer hover:opacity-80 ${borderClass}`}
            style={{
                ...commonStyle,
                color: color || '#fff',
                fontSize: `${text_size || 36}px`,
                whiteSpace: 'nowrap'
            }}
          >
            {text || "Text"}
          </div>
        );
      
      case WidgetType.BUTTON:
        return (
          <div 
            key={widget.id}
            onClick={(e) => { e.stopPropagation(); onSelect(widget.id); }}
            className={`flex items-center justify-center cursor-pointer hover:opacity-90 ${borderClass}`}
            style={{
                ...commonStyle,
                backgroundColor: normal_color || '#333',
                color: '#fff',
                fontSize: `${text_size || 30}px`,
                borderRadius: `${radius || 12}px`,
            }}
          >
            {text || "Button"}
          </div>
        );

      case WidgetType.CIRCLE:
        return (
            <div
                key={widget.id}
                onClick={(e) => { e.stopPropagation(); onSelect(widget.id); }}
                className={`cursor-pointer hover:opacity-90 ${borderClass}`}
                style={{
                    ...commonStyle,
                    backgroundColor: color || '#ff0000',
                    borderRadius: '50%'
                }}
            />
        );
        
        case WidgetType.RECT:
        return (
            <div
                key={widget.id}
                onClick={(e) => { e.stopPropagation(); onSelect(widget.id); }}
                className={`cursor-pointer hover:opacity-90 ${borderClass}`}
                style={{
                    ...commonStyle,
                    backgroundColor: color || '#ff0000',
                    borderRadius: `${radius || 0}px`
                }}
            />
        );

        case WidgetType.VOICE_BUTTON:
            return (
                <div 
                  key={widget.id}
                  onClick={(e) => { e.stopPropagation(); onSelect(widget.id); }}
                  className={`flex items-center justify-center cursor-pointer hover:opacity-90 shadow-lg ${borderClass}`}
                  style={{
                      ...commonStyle,
                      backgroundColor: normal_color || '#ef4444',
                      color: '#fff',
                      borderRadius: '50%',
                  }}
                >
                  <Mic size={Math.min(w, h) * 0.5} />
                </div>
              );

        case WidgetType.TODO_LIST:
            return (
                <div
                    key={widget.id}
                    onClick={(e) => { e.stopPropagation(); onSelect(widget.id); }}
                    className={`cursor-pointer hover:opacity-90 overflow-hidden bg-gray-900/50 rounded-lg border border-gray-700 ${borderClass}`}
                    style={commonStyle}
                >
                    <div className="flex flex-col p-2 space-y-2">
                        {/* Mock Items */}
                        {[1, 2, 3].map(i => (
                            <div key={i} className="flex items-center gap-2 p-2 bg-gray-800 rounded">
                                {i === 1 ? <Square size={16} className="text-gray-400" /> : <CheckSquare size={16} className="text-green-500" />}
                                <span className="text-sm text-gray-200">Task Item {i}</span>
                            </div>
                        ))}
                    </div>
                </div>
            );

      default:
        return null;
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center bg-[#1e1e1e] relative overflow-hidden p-8">
      {/* Watch Bezel Simulation (Amazfit Balance style - round) */}
      <div className="relative w-[500px] h-[500px] bg-gray-800 rounded-full shadow-2xl flex items-center justify-center border-4 border-gray-700">
        
        {/* Screen Area (480x480) */}
        <div 
            className="w-[480px] h-[480px] bg-black rounded-full relative overflow-hidden"
            onClick={() => onSelect('')} // Deselect on background click
        >
             {/* Grid helper (optional, low opacity) */}
             <div className="absolute inset-0 pointer-events-none opacity-10" 
                  style={{backgroundImage: 'radial-gradient(#555 1px, transparent 1px)', backgroundSize: '40px 40px'}}>
             </div>
             
             {/* Center markers */}
             <div className="absolute top-1/2 left-0 w-full h-[1px] bg-green-500 opacity-20 pointer-events-none"></div>
             <div className="absolute left-1/2 top-0 h-full w-[1px] bg-green-500 opacity-20 pointer-events-none"></div>

             {widgets.map(renderWidget)}
        </div>
        
        {/* Shine reflection effect */}
        <div className="absolute inset-0 rounded-full pointer-events-none bg-gradient-to-tr from-white/5 to-transparent"></div>
      </div>
      
      <div className="absolute bottom-4 left-4 text-gray-500 text-sm">
        Simulated Device: Amazfit Balance (480x480)
      </div>
    </div>
  );
};

export default WatchPreview;