import React, { useState, useEffect } from 'react';
import JSZip from 'jszip';
import WatchPreview from './components/WatchPreview';
import { ZeppWidget, WidgetType, WidgetProps } from './types';
import { generateZeppCode, generateAppJson, generateReadme } from './services/zeppGenerator';
import { generateLayoutFromPrompt } from './services/geminiService';
import { 
    Layout, Type, Image as ImageIcon, Circle, Code, 
    Wand2, Download, Trash2, Plus, GripVertical, 
    MousePointer2, Square, RefreshCcw, Mic, ListTodo, FileJson, FileCode
} from 'lucide-react';

const INITIAL_WIDGETS: ZeppWidget[] = [
    {
        id: '1',
        type: WidgetType.TEXT,
        name: 'Time',
        props: { x: 140, y: 50, w: 200, h: 80, text: '10:09', text_size: 72, color: '#ffffff' }
    }
];

export default function App() {
  const [widgets, setWidgets] = useState<ZeppWidget[]>(INITIAL_WIDGETS);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  
  // Code Viewer State
  const [showCode, setShowCode] = useState(false);
  const [codeTab, setCodeTab] = useState<'js' | 'json'>('js');
  const [generatedCode, setGeneratedCode] = useState('');
  const [generatedJson, setGeneratedJson] = useState('');
  
  // AI State
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiError, setAiError] = useState('');

  const selectedWidget = widgets.find(w => w.id === selectedId);

  // Auto-generate code when widgets change
  useEffect(() => {
    setGeneratedCode(generateZeppCode(widgets));
    setGeneratedJson(generateAppJson(widgets));
  }, [widgets]);

  const addWidget = (type: WidgetType) => {
    const newWidget: ZeppWidget = {
      id: `w-${Date.now()}`,
      type,
      name: `New ${type}`,
      props: {
        x: 240 - 50,
        y: 240 - 25,
        w: 100,
        h: 50,
        text: type === WidgetType.TEXT || type === WidgetType.BUTTON ? 'Label' : undefined,
        color: '#ffffff',
        text_size: 36
      }
    };
    
    // Default sizes for shapes
    if (type === WidgetType.CIRCLE) {
        newWidget.props.w = 60;
        newWidget.props.h = 60;
        newWidget.props.color = '#3e8bf3';
    }
    if (type === WidgetType.BUTTON) {
        newWidget.props.normal_color = '#3e8bf3';
        newWidget.props.press_color = '#2563eb';
        newWidget.props.radius = 12;
    }
    if (type === WidgetType.RECT) {
        newWidget.props.color = '#3e8bf3';
        newWidget.props.radius = 8;
        newWidget.props.w = 80;
        newWidget.props.h = 80;
    }
    if (type === WidgetType.VOICE_BUTTON) {
        newWidget.props.w = 64;
        newWidget.props.h = 64;
        newWidget.props.normal_color = '#ef4444';
        newWidget.props.x = 240 - 32;
        newWidget.props.y = 350;
    }
    if (type === WidgetType.TODO_LIST) {
        newWidget.props.w = 300;
        newWidget.props.h = 200;
        newWidget.props.x = 90;
        newWidget.props.y = 140;
        newWidget.props.api_endpoint = 'https://api.todoist.com/rest/v2/tasks';
    }

    setWidgets([...widgets, newWidget]);
    setSelectedId(newWidget.id);
  };

  const updateWidget = (id: string, updates: Partial<WidgetProps>) => {
    setWidgets(widgets.map(w => 
      w.id === id ? { ...w, props: { ...w.props, ...updates } } : w
    ));
  };

  const deleteWidget = (id: string) => {
    setWidgets(widgets.filter(w => w.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const handleAiGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setAiError('');
    try {
        const newWidgets = await generateLayoutFromPrompt(prompt);
        if (newWidgets.length > 0) {
            setWidgets(newWidgets);
            setSelectedId(null);
        }
    } catch (e) {
        setAiError('Failed to generate layout. Check API Key.');
    } finally {
        setIsGenerating(false);
    }
  };

  const handleDownloadProject = async () => {
    try {
        const zip = new JSZip();
        
        // Root config files
        zip.file("app.json", generatedJson);
        zip.file("README.md", generateReadme());
        
        // Page code
        const pageFolder = zip.folder("page");
        if (pageFolder) {
            pageFolder.file("index.js", generatedCode);
        }

        const blob = await zip.generateAsync({ type: "blob" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "zepp-ai-project.zip";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error("Failed to zip project", error);
        alert("Failed to generate download.");
    }
  };

  return (
    <div className="flex h-screen w-screen bg-[#1e1e1e] text-gray-300 font-sans">
      
      {/* Left Sidebar: Toolbar */}
      <div className="w-16 bg-[#252526] border-r border-[#333] flex flex-col items-center py-4 space-y-4">
        <div className="p-2 bg-blue-600 rounded-lg mb-4">
            <Layout className="text-white w-6 h-6" />
        </div>
        
        <TooltipIcon icon={<Type size={20} />} label="Text" onClick={() => addWidget(WidgetType.TEXT)} />
        <TooltipIcon icon={<MousePointer2 size={20} />} label="Button" onClick={() => addWidget(WidgetType.BUTTON)} />
        <TooltipIcon icon={<Circle size={20} />} label="Circle" onClick={() => addWidget(WidgetType.CIRCLE)} />
        <TooltipIcon icon={<Square size={20} />} label="Rect" onClick={() => addWidget(WidgetType.RECT)} />
        
        <div className="h-px w-8 bg-[#333] my-2" />
        
        <TooltipIcon icon={<ListTodo size={20} className="text-green-400" />} label="Todo List" onClick={() => addWidget(WidgetType.TODO_LIST)} />
        <TooltipIcon icon={<Mic size={20} className="text-red-400" />} label="Voice Btn" onClick={() => addWidget(WidgetType.VOICE_BUTTON)} />
        
        <div className="flex-grow" />
        
        <TooltipIcon icon={<Download size={20} />} label="Download Project" onClick={handleDownloadProject} />
        <TooltipIcon icon={<Code size={20} />} label="View Code" onClick={() => setShowCode(true)} />
      </div>

      {/* Main Content: Canvas & AI Bar */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Bar: AI Prompt */}
        <div className="h-16 bg-[#252526] border-b border-[#333] flex items-center px-6 gap-4">
            <div className="flex items-center gap-2 text-white font-semibold mr-4">
                <span>ZeppBuilder AI</span>
                <span className="text-xs bg-blue-900 text-blue-200 px-2 py-0.5 rounded border border-blue-700">Beta</span>
            </div>
            
            <div className="flex-1 max-w-2xl relative flex items-center">
                <Wand2 className={`absolute left-3 w-4 h-4 ${isGenerating ? 'animate-spin text-blue-400' : 'text-gray-400'}`} />
                <input 
                    type="text" 
                    placeholder="Try: 'Todoist list in center with a red voice button at bottom'"
                    className="w-full bg-[#1e1e1e] border border-[#333] rounded-md py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAiGenerate()}
                />
                <button 
                    onClick={handleAiGenerate}
                    disabled={isGenerating}
                    className="ml-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50"
                >
                    {isGenerating ? 'Thinking...' : 'Generate'}
                </button>
            </div>
            {aiError && <span className="text-red-400 text-xs">{aiError}</span>}
        </div>

        {/* Canvas Area */}
        <WatchPreview widgets={widgets} selectedId={selectedId} onSelect={setSelectedId} />
      </div>

      {/* Right Sidebar: Properties */}
      <div className="w-80 bg-[#252526] border-l border-[#333] flex flex-col">
        <div className="h-14 border-b border-[#333] flex items-center px-4 font-semibold text-white">
            Properties
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {selectedWidget ? (
                <>
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs uppercase font-bold text-gray-500">{selectedWidget.type.replace('_', ' ')}</span>
                        <button onClick={() => deleteWidget(selectedWidget.id)} className="text-red-400 hover:text-red-300 p-1 rounded hover:bg-white/5">
                            <Trash2 size={16} />
                        </button>
                    </div>

                    <div className="space-y-4">
                         {/* Common Position */}
                         <div className="grid grid-cols-2 gap-4">
                            <NumberInput label="X" value={selectedWidget.props.x} onChange={(v) => updateWidget(selectedWidget.id, { x: v })} />
                            <NumberInput label="Y" value={selectedWidget.props.y} onChange={(v) => updateWidget(selectedWidget.id, { y: v })} />
                            <NumberInput label="Width" value={selectedWidget.props.w} onChange={(v) => updateWidget(selectedWidget.id, { w: v })} />
                            <NumberInput label="Height" value={selectedWidget.props.h} onChange={(v) => updateWidget(selectedWidget.id, { h: v })} />
                        </div>

                        {/* Colors */}
                        {(selectedWidget.props.color !== undefined) && (
                            <ColorInput label="Color" value={selectedWidget.props.color} onChange={(v) => updateWidget(selectedWidget.id, { color: v })} />
                        )}
                        {(selectedWidget.props.normal_color !== undefined) && (
                            <ColorInput label="Bg Color" value={selectedWidget.props.normal_color} onChange={(v) => updateWidget(selectedWidget.id, { normal_color: v })} />
                        )}

                        {/* Text */}
                        {(selectedWidget.type === WidgetType.TEXT || selectedWidget.type === WidgetType.BUTTON) && (
                            <>
                                <TextInput label="Text Content" value={selectedWidget.props.text || ''} onChange={(v) => updateWidget(selectedWidget.id, { text: v })} />
                                <NumberInput label="Font Size" value={selectedWidget.props.text_size || 36} onChange={(v) => updateWidget(selectedWidget.id, { text_size: v })} />
                            </>
                        )}
                        
                        {/* API Integration */}
                        {selectedWidget.type === WidgetType.TODO_LIST && (
                            <div className="border-t border-[#333] pt-4">
                                <h4 className="text-xs font-bold text-green-400 mb-2 uppercase">Data Source</h4>
                                <TextInput label="API Endpoint" value={selectedWidget.props.api_endpoint || ''} onChange={(v) => updateWidget(selectedWidget.id, { api_endpoint: v })} />
                                <p className="text-[10px] text-gray-500 mt-1">Generated code will use this URL to fetch tasks.</p>
                            </div>
                        )}
                        
                        {/* Radius */}
                        {(selectedWidget.props.radius !== undefined) && (
                             <NumberInput label="Radius" value={selectedWidget.props.radius} onChange={(v) => updateWidget(selectedWidget.id, { radius: v })} />
                        )}
                    </div>
                </>
            ) : (
                <div className="text-center text-gray-500 mt-10 flex flex-col items-center">
                    <MousePointer2 className="mb-2 opacity-50" />
                    <p>Select a widget on the canvas to edit properties.</p>
                </div>
            )}
        </div>

        {/* Layer List (Simplified) */}
        <div className="border-t border-[#333] flex-1 overflow-y-auto max-h-[40%]">
             <div className="h-10 bg-[#2b2b2d] flex items-center px-4 text-xs font-bold text-gray-400 uppercase tracking-wider">
                Layers
             </div>
             <div className="p-2 space-y-1">
                 {widgets.map(w => (
                     <div 
                        key={w.id} 
                        onClick={() => setSelectedId(w.id)}
                        className={`flex items-center px-3 py-2 text-sm rounded cursor-pointer ${selectedId === w.id ? 'bg-blue-600 text-white' : 'hover:bg-[#333] text-gray-400'}`}
                    >
                        {w.type === WidgetType.TEXT && <Type size={14} className="mr-2 opacity-70" />}
                        {w.type === WidgetType.BUTTON && <MousePointer2 size={14} className="mr-2 opacity-70" />}
                        {w.type === WidgetType.CIRCLE && <Circle size={14} className="mr-2 opacity-70" />}
                        {w.type === WidgetType.RECT && <Square size={14} className="mr-2 opacity-70" />}
                        {w.type === WidgetType.TODO_LIST && <ListTodo size={14} className="mr-2 opacity-70 text-green-400" />}
                        {w.type === WidgetType.VOICE_BUTTON && <Mic size={14} className="mr-2 opacity-70 text-red-400" />}
                        {w.name || w.type}
                     </div>
                 ))}
             </div>
        </div>
      </div>

      {/* Code Modal */}
      {showCode && (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-8">
            <div className="bg-[#1e1e1e] w-full max-w-4xl h-[80vh] rounded-xl border border-[#333] flex flex-col shadow-2xl">
                
                {/* Modal Header */}
                <div className="flex items-center justify-between p-4 border-b border-[#333] bg-[#252526]">
                    <div className="flex items-center gap-4">
                        <h3 className="font-semibold text-white flex items-center gap-2">
                             Project Files
                        </h3>
                        {/* Tabs */}
                        <div className="flex bg-[#1a1a1a] rounded p-1">
                            <button 
                                onClick={() => setCodeTab('js')}
                                className={`flex items-center gap-2 px-3 py-1 rounded text-xs font-medium transition-colors ${codeTab === 'js' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                            >
                                <FileCode size={14} /> page/index.js
                            </button>
                            <button 
                                onClick={() => setCodeTab('json')}
                                className={`flex items-center gap-2 px-3 py-1 rounded text-xs font-medium transition-colors ${codeTab === 'json' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                            >
                                <FileJson size={14} /> app.json
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button 
                            className="text-gray-400 hover:text-white px-3 py-1 rounded"
                            onClick={() => {
                                navigator.clipboard.writeText(codeTab === 'js' ? generatedCode : generatedJson);
                                alert("Copied to clipboard!");
                            }}
                        >
                            Copy
                        </button>
                        <button 
                            className="text-gray-400 hover:text-white px-3 py-1 rounded"
                            onClick={() => setShowCode(false)}
                        >
                            Close
                        </button>
                    </div>
                </div>

                {/* Modal Content */}
                <div className="flex-1 overflow-auto bg-[#1a1a1a] p-4 font-mono text-sm">
                    {codeTab === 'js' ? (
                        <pre className="text-green-400">{generatedCode}</pre>
                    ) : (
                        <pre className="text-yellow-400">{generatedJson}</pre>
                    )}
                </div>
                
                <div className="p-4 border-t border-[#333] bg-[#252526] text-xs text-gray-500 flex justify-between">
                    <span>Target: Zepp OS 3.0+ (Amazfit Balance)</span>
                    <span>{codeTab === 'json' ? 'Defines app permissions & structure' : 'Contains UI logic & event handlers'}</span>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}

// Helper Components

const TooltipIcon = ({ icon, label, onClick }: { icon: React.ReactNode, label: string, onClick: () => void }) => (
    <div className="group relative">
        <button 
            onClick={onClick}
            className="p-3 text-gray-400 hover:text-white hover:bg-[#333] rounded-lg transition-all"
        >
            {icon}
        </button>
        <div className="absolute left-14 top-1/2 -translate-y-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
            {label}
        </div>
    </div>
);

const NumberInput = ({ label, value, onChange }: { label: string, value: number, onChange: (val: number) => void }) => (
    <div className="flex flex-col gap-1">
        <label className="text-xs text-gray-500">{label}</label>
        <input 
            type="number" 
            value={value} 
            onChange={(e) => onChange(Number(e.target.value))}
            className="bg-[#1a1a1a] border border-[#333] rounded px-2 py-1 text-sm text-white focus:border-blue-500 outline-none"
        />
    </div>
);

const TextInput = ({ label, value, onChange }: { label: string, value: string, onChange: (val: string) => void }) => (
    <div className="flex flex-col gap-1">
        <label className="text-xs text-gray-500">{label}</label>
        <input 
            type="text" 
            value={value} 
            onChange={(e) => onChange(e.target.value)}
            className="bg-[#1a1a1a] border border-[#333] rounded px-2 py-1 text-sm text-white focus:border-blue-500 outline-none"
        />
    </div>
);

const ColorInput = ({ label, value, onChange }: { label: string, value: string, onChange: (val: string) => void }) => (
    <div className="flex flex-col gap-1">
        <label className="text-xs text-gray-500">{label}</label>
        <div className="flex gap-2">
            <input 
                type="color" 
                value={value} 
                onChange={(e) => onChange(e.target.value)}
                className="h-8 w-8 bg-transparent cursor-pointer rounded overflow-hidden"
            />
            <input 
                type="text" 
                value={value} 
                onChange={(e) => onChange(e.target.value)}
                className="flex-1 bg-[#1a1a1a] border border-[#333] rounded px-2 py-1 text-sm text-white focus:border-blue-500 outline-none uppercase"
            />
        </div>
    </div>
);
