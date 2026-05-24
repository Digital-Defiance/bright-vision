import { useState, useEffect, useRef } from 'react'
import { Terminal, Settings, GitBranch, MessageSquare, Save, RotateCcw, Play, Square, Send } from 'lucide-react'
import { invoke } from '@tauri-apps/api/core'
import { listen, UnlistenFn } from '@tauri-apps/api/event'

interface AiderConfig {
  binaryPath: string
  model: string
  extraParams: string
  workingDir: string
  autoApproveLimit: number
}

interface ChatMessage {
  id: number
  role: 'user' | 'assistant' | 'system'
  content: string
}

interface ToolEvent {
  id: number
  type: 'tool_call' | 'tool_result'
  name?: string
  input?: string
  output?: string
}

interface TerminalLine {
  id: number
  text: string
  type: 'stdout' | 'stderr'
}

const DEFAULT_CONFIG: AiderConfig = {
  binaryPath: 'aider',
  model: 'ollama_chat/qwen3.6:27b-q4_K_M',
  extraParams: '{"think": false}',
  workingDir: '.',
  autoApproveLimit: 0
}

function App() {
  const [activeTab, setActiveTab] = useState('chat')
  const [config, setConfig] = useState<AiderConfig>(DEFAULT_CONFIG)
  const [savedConfig, setSavedConfig] = useState<AiderConfig>(DEFAULT_CONFIG)
  const [isRunning, setIsRunning] = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [toolEvents, setToolEvents] = useState<ToolEvent[]>([])
  const [terminalLines, setTerminalLines] = useState<TerminalLine[]>([])
  const [inputValue, setInputValue] = useState('')
  const [remainingAutoApproves, setRemainingAutoApproves] = useState(0)
  const [statusMessage, setStatusMessage] = useState('')
  const chatEndRef = useRef<HTMLDivElement>(null)
  const terminalEndRef = useRef<HTMLDivElement>(null)
  const [unlistenChat, setUnlistenChat] = useState<UnlistenFn | null>(null)
  const [unlistenTool, setUnlistenTool] = useState<UnlistenFn | null>(null)
  const [unlistenStatus, setUnlistenStatus] = useState<UnlistenFn | null>(null)
  const [unlistenOutput, setUnlistenOutput] = useState<UnlistenFn | null>(null)
  const [unlistenError, setUnlistenError] = useState<UnlistenFn | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem('aider-vision-config')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        setConfig(parsed)
        setSavedConfig(parsed)
      } catch (e) {
        console.error('Failed to parse stored config', e)
      }
    }
  }, [])

  useEffect(() => {
    const setupListeners = async () => {
      const listenChat = await listen<{ role: string; content: string }>('aider-chat', (event) => {
        setChatMessages(prev => [...prev, {
          id: Date.now(),
          role: event.payload.role as 'user' | 'assistant' | 'system',
          content: event.payload.content
        }])
      })
      setUnlistenChat(() => listenChat)

      const listenTool = await listen<any>('aider-tool', (event) => {
        setToolEvents(prev => [...prev, {
          id: Date.now(),
          type: event.payload.type,
          name: event.payload.payload?.name,
          input: event.payload.payload?.input,
          output: event.payload.payload?.output
        }])
      })
      setUnlistenTool(() => listenTool)

      const listenStatus = await listen<string>('aider-status', (event) => {
        setStatusMessage(event.payload)
        setTerminalLines(prev => [...prev, { id: Date.now(), text: `[STATUS] ${event.payload}`, type: 'stdout' }])
      })
      setUnlistenStatus(() => listenStatus)

      const listenOutput = await listen<string>('aider-output', (event) => {
        setTerminalLines(prev => [...prev, { id: Date.now(), text: event.payload, type: 'stdout' }])
      })
      setUnlistenOutput(() => listenOutput)

      const listenError = await listen<string>('aider-error', (event) => {
        setTerminalLines(prev => [...prev, { id: Date.now(), text: event.payload, type: 'stderr' }])
      })
      setUnlistenError(() => listenError)
    }
    setupListeners()
  }, [])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [terminalLines])

  const handleSave = () => {
    setSavedConfig(config)
    localStorage.setItem('aider-vision-config', JSON.stringify(config))
  }

  const handleReset = () => {
    setConfig(DEFAULT_CONFIG)
    setSavedConfig(DEFAULT_CONFIG)
    localStorage.removeItem('aider-vision-config')
  }

  const handleStart = async () => {
    try {
      await invoke('start_aider', {
        binary: savedConfig.binaryPath,
        model: savedConfig.model,
        extraParams: savedConfig.extraParams,
        workingDir: savedConfig.workingDir,
        autoApproveLimit: savedConfig.autoApproveLimit
      })
      setIsRunning(true)
      setRemainingAutoApproves(savedConfig.autoApproveLimit)
      setChatMessages([])
      setToolEvents([])
      setTerminalLines([{ id: Date.now(), text: 'Aider process started.', type: 'stdout' }])
      setStatusMessage('Aider started')
    } catch (err) {
      console.error(err)
      setTerminalLines(prev => [...prev, { id: Date.now(), text: `Error: ${err}`, type: 'stderr' }])
    }
  }

  const handleStop = async () => {
    try {
      await invoke('stop_aider')
      setIsRunning(false)
      setRemainingAutoApproves(0)
      setTerminalLines(prev => [...prev, { id: Date.now(), text: 'Aider process stopped.', type: 'stdout' }])
      setStatusMessage('Aider stopped')
    } catch (err) {
      console.error(err)
    }
  }

  const handleSend = async () => {
    if (!inputValue.trim() || !isRunning) return
    try {
      await invoke('send_to_aider', { input: inputValue })
      setChatMessages(prev => [...prev, { id: Date.now(), role: 'user', content: inputValue }])
      if (remainingAutoApproves > 0) {
        setRemainingAutoApproves(prev => Math.max(0, prev - 1))
      }
      setInputValue('')
    } catch (err) {
      console.error(err)
    }
  }

  const generateCommandPreview = () => {
    const cmd = `${config.binaryPath} --model ${config.model}`
    const extra = config.extraParams ? `LITELLM_EXTRA_PARAMS="${config.extraParams}" ` : ''
    const autoApprove = config.autoApproveLimit > 0 ? ' --auto-approve' : ''
    return `${extra}${cmd}${autoApprove}`
  }

  return (
    <div className="flex h-screen bg-gray-900 text-gray-100 font-sans">
      {/* Sidebar */}
      <aside className="w-16 flex flex-col items-center py-4 bg-gray-950 border-r border-gray-800">
        <button 
          onClick={() => setActiveTab('chat')}
          className={`p-3 mb-2 rounded-lg transition-colors ${activeTab === 'chat' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-800'}`}
        >
          <MessageSquare size={24} />
        </button>
        <button 
          onClick={() => setActiveTab('terminal')}
          className={`p-3 mb-2 rounded-lg transition-colors ${activeTab === 'terminal' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-800'}`}
        >
          <Terminal size={24} />
        </button>
        <button 
          onClick={() => setActiveTab('git')}
          className={`p-3 mb-2 rounded-lg transition-colors ${activeTab === 'git' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-800'}`}
        >
          <GitBranch size={24} />
        </button>
        <div className="mt-auto">
          <button 
            onClick={() => setActiveTab('settings')}
            className={`p-3 rounded-lg transition-colors ${activeTab === 'settings' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-800'}`}
          >
            <Settings size={24} />
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        <header className="h-12 border-b border-gray-800 flex items-center justify-between px-4 bg-gray-900">
          <h1 className="text-lg font-semibold tracking-tight">Aider Vision</h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${isRunning ? 'bg-green-500' : 'bg-gray-500'}`}></span>
              <span className="text-xs text-gray-400">{statusMessage || (isRunning ? 'Aider Running' : 'Aider Stopped')}</span>
            </div>
            {remainingAutoApproves > 0 && (
              <div className="flex items-center gap-1 bg-blue-900/50 text-blue-300 px-2 py-1 rounded text-xs">
                <span>Auto-approve: {remainingAutoApproves}</span>
              </div>
            )}
          </div>
        </header>
        
        <div className="flex-1 p-6 overflow-auto">
          {activeTab === 'chat' && (
            <div className="flex flex-col h-full max-w-4xl mx-auto">
              <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
                {chatMessages.length === 0 && (
                  <div className="bg-gray-800 p-4 rounded-lg shadow-sm text-center text-gray-400">
                    <p>Welcome to Aider Vision. Start a conversation to begin coding.</p>
                  </div>
                )}
                {chatMessages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-3 rounded-lg ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-200'}`}>
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                ))}
                {toolEvents.map((tool) => (
                  <div key={tool.id} className="flex justify-start">
                    <div className="max-w-[80%] p-3 rounded-lg bg-gray-800/50 border border-gray-700 text-sm font-mono">
                      <div className="text-yellow-400 mb-1">
                        {tool.type === 'tool_call' ? `🛠 Calling ${tool.name || 'tool'}...` : `✅ ${tool.name || 'tool'} result:`}
                      </div>
                      <pre className="text-gray-300 overflow-x-auto whitespace-pre-wrap">
                        {tool.type === 'tool_call' ? JSON.stringify(tool.input, null, 2) : JSON.stringify(tool.output, null, 2)}
                      </pre>
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder={isRunning ? "Ask Aider to modify your code..." : "Start Aider to interact..."}
                  disabled={!isRunning}
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                />
                <button 
                  onClick={handleSend}
                  disabled={!isRunning || !inputValue.trim()}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                >
                  <Send size={18} /> Send
                </button>
              </div>
            </div>
          )}
          {activeTab === 'terminal' && (
            <div className="flex flex-col h-full bg-gray-950 rounded-lg border border-gray-800 overflow-hidden">
              <div className="flex-1 p-4 font-mono text-sm overflow-y-auto space-y-1">
                {terminalLines.map((line) => (
                  <div key={line.id} className={line.type === 'stderr' ? 'text-red-400' : 'text-gray-300'}>
                    {line.text}
                  </div>
                ))}
                <div ref={terminalEndRef} />
              </div>
              <div className="p-4 border-t border-gray-800 bg-gray-900">
                <div className="flex gap-2">
                  <button 
                    onClick={handleStart} 
                    disabled={isRunning}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    <Play size={18} /> Start
                  </button>
                  <button 
                    onClick={handleStop} 
                    disabled={!isRunning}
                    className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    <Square size={18} /> Stop
                  </button>
                </div>
              </div>
            </div>
          )}
          {activeTab === 'git' && (
            <div className="bg-gray-950 p-4 rounded-lg h-full flex items-center justify-center text-gray-500">
              Git History & Diff Viewer Placeholder
            </div>
          )}
          {activeTab === 'settings' && (
            <div className="max-w-xl mx-auto space-y-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Settings size={20} /> Model & System Configuration
              </h2>
              
              <div className="space-y-4 bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-400">Aider Binary / Command</label>
                  <input 
                    type="text" 
                    className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={config.binaryPath}
                    onChange={(e) => setConfig({...config, binaryPath: e.target.value})}
                    placeholder="aider or python3 -m aider"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-400">LLM Model</label>
                  <input 
                    type="text" 
                    className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={config.model}
                    onChange={(e) => setConfig({...config, model: e.target.value})}
                    placeholder="ollama_chat/qwen3.6:27b-q4_K_M"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-400">LiteLLM Extra Params (JSON)</label>
                  <textarea 
                    className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                    value={config.extraParams}
                    onChange={(e) => setConfig({...config, extraParams: e.target.value})}
                    placeholder='{"think": false}'
                    rows={3}
                  />
                  <p className="text-xs text-gray-500">Passed as LITELLM_EXTRA_PARAMS environment variable.</p>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-400">Working Directory</label>
                  <input 
                    type="text" 
                    className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={config.workingDir}
                    onChange={(e) => setConfig({...config, workingDir: e.target.value})}
                    placeholder="~/projects/my-app"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-400">Auto-Approve Limit</label>
                  <input 
                    type="number" 
                    min="0"
                    className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={config.autoApproveLimit}
                    onChange={(e) => setConfig({...config, autoApproveLimit: parseInt(e.target.value) || 0})}
                    placeholder="0 (disabled)"
                  />
                  <p className="text-xs text-gray-500">Set &gt;0 to enable --auto-approve. Counts down per prompt sent.</p>
                </div>
              </div>

              <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                <label className="block text-sm font-medium text-gray-400 mb-2">Command Preview</label>
                <code className="block bg-gray-950 p-3 rounded text-sm font-mono text-green-400 break-all">
                  {generateCommandPreview()}
                </code>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={handleSave}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <Save size={18} /> Save Configuration
                </button>
                <button 
                  onClick={handleReset}
                  className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <RotateCcw size={18} /> Reset Defaults
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default App
