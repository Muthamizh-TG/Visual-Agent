import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
// Terminal UI styles
const terminalStyles = {
  background: '#18181b',
  color: '#39ff14',
  fontFamily: 'monospace',
  fontSize: '1rem',
  borderRadius: '8px',
  padding: '1rem',
  margin: '2rem 1rem',
  minHeight: '180px',
  maxHeight: '300px',
  overflowY: 'auto',
  boxShadow: '0 2px 16px rgba(0,0,0,0.2)',
  border: '1px solid #333',
};
import { Bot, Calculator, Heart, Cloud, Newspaper, Smile, ArrowRight, MessageSquare, Send, Activity } from 'lucide-react';

// Enhanced White Theme Styles
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  .workflow-container {
    width: 100vw;
    height: 100vh;
    background: linear-gradient(135deg, #000000ff 0%, #000000ff 50%, #000000ff 100%);
    color: #333;
    display: flex;
    flex-direction: row;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    overflow: hidden;
    position: relative;
  }

  .workflow-container::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: 
      radial-gradient(circle at 20% 50%, rgba(4, 0, 60, 1), transparent 50%),
      radial-gradient(circle at 80% 80%, rgba(147, 0, 74, 1), transparent 50%),
      radial-gradient(circle at 40% 20%, rgba(59, 130, 246, 0.3), transparent 50%);
    animation: gradientShift 15s ease infinite;
    pointer-events: none;
  }

  @keyframes gradientShift {
    0%, 100% { opacity: 0.5; transform: scale(1); }
    50% { opacity: 0.8; transform: scale(1.1); }
  }

  @media (max-width: 768px) {
    .workflow-container {
      flex-direction: column;
    }
  }

  .left-panel {
    flex: 2;
    min-width: 0;
    position: relative;
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(20px);
    border-right: 1px solid rgba(255, 255, 255, 0.1);
    height: 100vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  @media (max-width: 768px) {
    .left-panel {
      height: 60vh;
      flex: none;
      border-right: none;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }
  }

  .header {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(20px);
    padding: 1.5rem 2rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
    z-index: 10;
    box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
  }

  @media (max-width: 480px) {
    .header {
      padding: 1rem 1rem;
    }
  }

  .header-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .header-title {
    font-size: 1.5rem;
    font-weight: 800;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    color: #ffffff;
    text-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  }

  @media (max-width: 480px) {
    .header-title {
      font-size: 1.25rem;
    }
  }

  .header-subtitle {
    color: rgba(255, 255, 255, 0.9);
    font-size: 0.875rem;
    margin-top: 0.25rem;
    font-weight: 500;
  }

  @media (max-width: 480px) {
    .header-subtitle {
      font-size: 0.75rem;
    }
  }

  .connection-status {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-size: 0.875rem;
    color: #ffffff;
    background: rgba(255, 255, 255, 0.15);
    padding: 0.75rem 1.5rem;
    border-radius: 2rem;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;
  }

  .connection-status:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: translateY(-2px);
  }

  @media (max-width: 480px) {
    .connection-status {
      font-size: 0.75rem;
      padding: 0.5rem 1rem;
    }
  }

  .status-dot {
    width: 0.75rem;
    height: 0.75rem;
    border-radius: 50%;
    background-color: rgba(255, 255, 255, 0.3);
    border: 2px solid rgba(255, 255, 255, 0.5);
    transition: all 0.3s ease;
  }

  .status-connected {
    background-color: #10b981;
    border-color: #10b981;
    box-shadow: 0 0 20px rgba(16, 185, 129, 0.6);
    animation: pulse 2s ease-in-out infinite;
  }

  .status-disconnected {
    background-color: #ef4444;
    border-color: #ef4444;
    box-shadow: 0 0 20px rgba(239, 68, 68, 0.6);
  }

  .workflow-canvas {
    padding: 6rem 2rem 2rem;
    height: 100vh;
    position: relative;
    overflow: auto;
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    grid-template-rows: repeat(3, 1fr);
    gap: 2rem;
    align-items: center;
    justify-items: center;
    background: transparent;
  }

  @media (max-width: 768px) {
    .workflow-canvas {
      height: calc(60vh - 4rem);
      padding: 5rem 1rem 1rem;
      gap: 1.5rem;
    }
  }

  @media (max-width: 480px) {
    .workflow-canvas {
      padding: 5rem 0.5rem 0.5rem;
      gap: 1rem;
    }
  }

  .workflow-node {
    position: relative;
    width: 180px;
    height: 80px;
    border-radius: 16px;
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    border: 2px solid rgba(255, 255, 255, 0.2);
    cursor: pointer;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    z-index: 5;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }

  .workflow-node::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  .workflow-node:hover::before {
    opacity: 1;
  }

  @media (max-width: 480px) {
    .workflow-node {
      width: 140px;
      height: 70px;
    }
  }

  .workflow-node.node-active {
    background: linear-gradient(135deg, rgba(239, 68, 68, 0.3) 0%, rgba(239, 68, 68, 0.1) 100%);
    border-color: #22c55e;
    border-width: 3px;
    box-shadow: 0 0 40px rgba(34, 197, 94, 0.4), 0 8px 32px rgba(0, 0, 0, 0.2);
    transform: scale(1.05);
    animation: nodeGlow 2s ease-in-out infinite;
  }

  @keyframes nodeGlow {
    0%, 100% { 
      box-shadow: 0 0 40px rgba(34, 197, 94, 0.4), 0 8px 32px rgba(0, 0, 0, 0.2);
    }
    50% { 
      box-shadow: 0 0 60px rgba(34, 197, 94, 0.6), 0 12px 48px rgba(0, 0, 0, 0.3);
    }
  }

  .workflow-node.node-router {
    width: 200px;
    background: linear-gradient(135deg, rgba(102, 126, 234, 0.3) 0%, rgba(118, 75, 162, 0.3) 100%);
    border-color: rgba(102, 126, 234, 0.5);
  }

  @media (max-width: 480px) {
    .workflow-node.node-router {
      width: 160px;
    }
  }

  .node-content {
    display: flex;
    align-items: center;
    gap: 1rem;
    color: #ffffff;
    position: relative;
    z-index: 2;
  }

  @media (max-width: 480px) {
    .node-content {
      gap: 0.75rem;
    }
  }

  .node-icon {
    width: 2rem;
    height: 2rem;
    padding: 0.4rem;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.2);
    color: #ffffff;
    transition: all 0.3s ease;
  }

  @media (max-width: 480px) {
    .node-icon {
      width: 1.75rem;
      height: 1.75rem;
      padding: 0.3rem;
    }
  }

  .node-icon-active {
    background: rgba(34, 197, 94, 0.3);
    color: #22c55e;
    animation: iconPulse 1.5s ease-in-out infinite;
  }

  @keyframes iconPulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.1); }
  }

  .node-label {
    font-size: 1rem;
    font-weight: 700;
    color: #ffffff;
    white-space: nowrap;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }

  @media (max-width: 480px) {
    .node-label {
      font-size: 0.875rem;
    }
  }

  .workflow-node:hover {
    transform: translateY(-4px) scale(1.02);
    box-shadow: 0 12px 48px rgba(0, 0, 0, 0.2);
  }

  .workflow-node.node-active:hover {
    transform: translateY(-4px) scale(1.07);
  }

  .node-details {
    position: absolute;
    bottom: 2rem;
    left: 2rem;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 1.5rem;
    padding: 2rem;
    width: 24rem;
    max-width: calc(100vw - 4rem);
    z-index: 20;
    color: #1e293b;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
    animation: slideUp 0.4s ease-out;
  }

  @keyframes slideUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @media (max-width: 768px) {
    .node-details {
      left: 1rem;
      right: 1rem;
      width: auto;
      max-width: none;
    }
  }

  .details-title {
    font-size: 1.25rem;
    font-weight: 800;
    margin-bottom: 0.75rem;
    color: #0f172a;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .details-description {
    color: #475569;
    font-size: 0.95rem;
    margin-bottom: 1rem;
    line-height: 1.6;
  }

  .details-code {
    font-size: 0.85rem;
    color: #64748b;
    background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
    padding: 1rem;
    border-radius: 0.75rem;
    white-space: pre-wrap;
    font-family: 'Monaco', 'Courier New', monospace;
    border: 1px solid #cbd5e1;
    line-height: 1.5;
  }

  .right-panel {
    width: 28vw;
    min-width: 320px;
    max-width: 450px;
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(20px);
    border-left: 1px solid rgba(255, 255, 255, 0.2);
    display: flex;
    flex-direction: column;
    box-shadow: -8px 0 40px rgba(0, 0, 0, 0.1);
    z-index: 2;
    padding: 2rem 0 0 0;
    height: 100vh;
    overflow: hidden;
  }

  @media (max-width: 768px) {
    .right-panel {
      width: 100vw;
      min-width: 100%;
      max-width: 100%;
      height: 40vh;
      border-left: none;
      border-top: 1px solid rgba(255, 255, 255, 0.2);
      box-shadow: 0 -8px 40px rgba(0, 0, 0, 0.1);
      padding-top: 1rem;
    }
  }

  .chat-header {
    padding: 0 2rem 1.5rem 2rem;
    border-bottom: none;
    background: transparent;
  }

  @media (max-width: 480px) {
    .chat-header {
      padding: 0 1rem 1rem 1rem;
    }
  }

  .chat-title {
    font-size: 1.25rem;
    font-weight: 800;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    color: #ffffff;
    margin-bottom: 0.25rem;
    text-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  }

  .chat-subtitle {
    color: rgba(255, 255, 255, 0.9);
    font-size: 0.95rem;
    margin-top: 0.25rem;
    font-weight: 500;
  }

  .messages-container {
    flex: 1;
    overflow-y: auto;
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    background: rgba(0, 0, 0, 0.05);
    border-radius: 1.5rem;
    box-shadow: inset 0 2px 20px rgba(0, 0, 0, 0.1);
    backdrop-filter: blur(10px);
    margin: 0 1rem;
  }

  @media (max-width: 480px) {
    .messages-container {
      padding: 1rem;
      gap: 1rem;
      margin: 0 0.5rem;
    }
  }

  .messages-container::-webkit-scrollbar {
    width: 8px;
  }

  .messages-container::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 10px;
  }

  .messages-container::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 10px;
  }

  .messages-container::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.3);
  }

  .empty-state {
    text-align: center;
    color: rgba(255, 255, 255, 0.8);
    padding: 3rem 1rem;
  }

  .empty-icon {
    width: 3.5rem;
    height: 3.5rem;
    margin: 0 auto 1rem;
    opacity: 0.6;
    color: #ffffff;
    animation: float 3s ease-in-out infinite;
  }

  @keyframes float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
  }

  .message-wrapper {
    display: flex;
    align-items: flex-end;
    gap: 1rem;
    animation: messageSlide 0.4s ease-out;
  }

  @keyframes messageSlide {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .message-user {
    flex-direction: row-reverse;
    justify-content: flex-end;
  }

  .message-bot {
    justify-content: flex-start;
  }

  .message-avatar {
    width: 42px;
    height: 42px;
    border-radius: 50%;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0.1) 100%);
    border: 2px solid rgba(255, 255, 255, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.2rem;
    color: #ffffff;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
    flex-shrink: 0;
  }

  .message-bubble {
    max-width: 100%;
    padding: 1rem 1.25rem;
    border-radius: 1.25rem;
    font-size: 0.95rem;
    line-height: 1.6;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    backdrop-filter: blur(10px);
    margin-bottom: 2px;
  }

  @media (max-width: 480px) {
    .message-bubble {
      max-width: 85%;
      padding: 0.875rem 1rem;
      font-size: 0.875rem;
    }
  }

  .bubble-user {
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.15) 100%);
    color: #ffffff;
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-top-right-radius: 0.5rem;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  }

  .bubble-bot {
    background: rgba(255, 255, 255, 0.95);
    color: #1e293b;
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-top-left-radius: 0.5rem;
  }

  .bubble-error {
    background: linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(239, 68, 68, 0.1) 100%);
    color: #ffffff;
    border: 1px solid rgba(239, 68, 68, 0.4);
    border-radius: 1.25rem;
  }

  .message-meta {
    font-size: 0.75rem;
    color: #64748b;
    margin-bottom: 0.5rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .loading-message {
    display: flex;
    justify-content: flex-start;
  }

  .loading-bubble {
    background: rgba(255, 255, 255, 0.2);
    color: #ffffff;
    padding: 1rem 1.5rem;
    border-radius: 1.5rem;
    border: 1px solid rgba(255, 255, 255, 0.3);
    backdrop-filter: blur(10px);
  }

  .loading-content {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .loading-spinner {
    width: 1.25rem;
    height: 1.25rem;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top: 2px solid #ffffff;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .input-container {
    padding: 1.5rem 2rem 2rem 2rem;
    border-top: none;
    background: transparent;
  }

  @media (max-width: 480px) {
    .input-container {
      padding: 1rem 1rem 1.5rem 1rem;
    }
  }

  .input-row {
    display: flex;
    gap: 1rem;
    align-items: center;
    background: rgba(255, 255, 255, 0.15);
    border-radius: 2rem;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    padding: 0.5rem;
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.3);
    transition: all 0.3s ease;
  }

  .input-row:focus-within {
    background: rgba(255, 255, 255, 0.2);
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
  }

  .message-input {
    flex: 1;
    padding: 1rem 1.5rem;
    background: transparent;
    border: none;
    border-radius: 1.5rem;
    color: #ffffff;
    font-size: 1rem;
    outline: none;
    transition: all 0.3s ease;
  }

  .message-input::placeholder {
    color: rgba(255, 255, 255, 0.6);
  }

  .message-input:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .send-button {
    padding: 1rem;
    min-width: 50px;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0.2) 100%);
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 1.25rem;
    color: #ffffff;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  }

  .send-button:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0.3) 100%);
  }

  .send-button:active:not(:disabled) {
    transform: scale(0.95);
  }

  .send-button:disabled {
    background: rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.4);
    cursor: not-allowed;
    box-shadow: none;
  }

  .execution-status {
    position: absolute;
    top: 7rem;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(20px);
    color: #ffffff;
    padding: 1rem 2rem;
    border-radius: 2rem;
    z-index: 20;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.3);
    font-weight: 600;
    animation: statusFade 0.4s ease-out;
  }

  @keyframes statusFade {
    from { opacity: 0; transform: translateX(-50%) translateY(-10px); }
    to { opacity: 1; transform: translateX(-50%) translateY(0); }
  }

  @media (max-width: 768px) {
    .execution-status {
      top: 5rem;
      padding: 0.75rem 1.5rem;
      font-size: 0.875rem;
    }
  }

  .status-indicator {
    width: 0.75rem;
    height: 0.75rem;
    background-color: #22c55e;
    border-radius: 50%;
    animation: pulse 1.5s ease-in-out infinite;
    box-shadow: 0 0 20px rgba(34, 197, 94, 0.6);
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.6; transform: scale(0.9); }
  }

  .metrics-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.25rem 0.5rem;
    background: rgba(34, 197, 94, 0.1);
    border-radius: 0.5rem;
    font-size: 0.75rem;
    color: #22c55e;
    font-weight: 600;
  }`;

// Insert styles into document
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}



const LangGraphVisualizer = () => {
  // Terminal output state
  const [terminalOutput, setTerminalOutput] = useState('');
  // Clear terminal on page refresh
  useEffect(() => {
    setTerminalOutput('');
  }, []);
  const [terminalConnected, setTerminalConnected] = useState(null);

  // Fetch terminal output from backend (plain text)
  useEffect(() => {
    const fetchTerminalOutput = async () => {
      try {
        const response = await fetch('http://localhost:8000/terminal-output');
        if (!response.ok) {
          setTerminalConnected(false);
          setTerminalOutput('Unable to fetch terminal output.');
          return;
        }
        const text = await response.text();
        setTerminalOutput(text);
        setTerminalConnected(true);
      } catch {
        setTerminalConnected(false);
        setTerminalOutput('Unable to fetch terminal output.');
      }
    };
    fetchTerminalOutput();
    const interval = setInterval(fetchTerminalOutput, 5000);
    return () => clearInterval(interval);
  }, []);
  const [selectedNode, setSelectedNode] = useState(null);
  const [executionPath, setExecutionPath] = useState([]);
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  // Responsive node refs and layout effect
  const canvasRef = useRef(null);
  // Node definitions matching your Python LangGraph structure (positions removed for grid alignment)
  const nodes = [
    {
      id: 'router',
      type: 'router',
      label: 'LLM Router',
      icon: Bot,
      description: 'Routes user input using OpenAi Chat',
      details: 'Function: llm_router()\nDecides which agent handles the query',
    },
    {
      id: 'flight',
      type: 'agent',
      label: 'Flight Agent',
      icon: Activity,
      description: 'Checks flight status and information',
      details: 'Function: flight_checker_agent()\nCapabilities: Flight status, schedules',
    },
    {
      id: 'tourist',
      type: 'agent',
      label: 'Tourist Agent',
      icon: Smile,
      description: 'Suggests tourist attractions',
      details: 'Function: tourist_attraction_agent()\nCapabilities: Attraction suggestions',
    },
    {
      id: 'weather',
      type: 'agent',
      label: 'Weather Agent',
      icon: Cloud,
      description: 'Provides weather information',
      details: 'Function: weather_agent()\nCapabilities: Weather queries',
    },
    {
      id: 'news',
      type: 'agent',
      label: 'News Agent',
      icon: Newspaper,
      description: 'Fetches latest news',
      details: 'Function: news_agent()\nCapabilities: News headlines',
    },
    {
      id: 'sentiment',
      type: 'agent',
      label: 'Sentiment Agent',
      icon: Heart,
      description: 'Analyzes sentiment and popularity',
      details: 'Function: sentiment_popularity_agent()\nCapabilities: Sentiment & popularity analysis',
    },
    {
      id: 'food',
      type: 'agent',
      label: 'Food Agent',
      icon: MessageSquare,
      description: 'Suggests food and meal plans',
      details: 'Function: food_planner_agent()\nCapabilities: Food and meal planning',
    },
    {
      id: 'emergency',
      type: 'agent',
      label: 'Emergency Agent',
      icon: ArrowRight,
      description: 'Provides emergency alerts',
      details: 'Function: emergency_alert_agent()\nCapabilities: Emergency alerts',
    },
    {
      id: 'traffic',
      type: 'agent',
      label: 'Traffic Condition Agent',
      icon: Calculator,
      description: 'Reports traffic conditions',
      details: 'Function: traffic_condition_agent()\nCapabilities: Traffic conditions',
    },
    {
      id: 'chat',
      type: 'agent',
      label: 'Chat Agent',
      icon: Bot,
      description: 'Acts like ChatGPT for normal conversation',
      details: 'Function: chat_agent()\nCapabilities: General conversation',
    },
    {
      id: 'custom',
      type: 'agent',
      label: 'Custom Agent',
      icon: Activity,
      description: 'Custom agent for demo',
      details: 'Function: custom_agent()\nCapabilities: Custom logic',
    },
  ];
  // Create refs for each node
  const nodeRefs = React.useMemo(() => {
    const refs = {};
    nodes.forEach(n => { refs[n.id] = refs[n.id] || React.createRef(); });
    return refs;
  }, [nodes.length]);
  // Re-render on resize for SVG lines
  const [, forceUpdate] = useState(0);
  useLayoutEffect(() => {
    const handleResize = () => forceUpdate(n => n + 1);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Scroll to bottom on messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Check backend connection
  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      const response = await fetch('http://localhost:8000/health');
      setIsConnected(response.ok);
    } catch (error) {
      setIsConnected(false);
    }
  };



  const connections = [
    { from: 'router', to: 'flight', condition: 'FlightCheckerAgent' },
    { from: 'router', to: 'tourist', condition: 'TouristAttractionAgent' },
    { from: 'router', to: 'weather', condition: 'WeatherAgent' },
    { from: 'router', to: 'news', condition: 'NewsAgent' },
    { from: 'router', to: 'sentiment', condition: 'SentimentPopularityAgent' },
    { from: 'router', to: 'food', condition: 'FoodPlannerAgent' },
    { from: 'router', to: 'emergency', condition: 'EmergencyAlertAgent' },
    { from: 'router', to: 'traffic', condition: 'TrafficConditionAgent' },
    { from: 'router', to: 'chat', condition: 'ChatAgent' },
  ];

  // Send message to Python backend
  const sendMessage = async () => {
    if (!userInput.trim() || !isConnected) return;

    setIsLoading(true);
    setExecutionPath([]); // All gray initially

    const newMessage = { type: 'user', content: userInput };
    setMessages(prev => [...prev, newMessage]);

    // Show 'Thinking...' in terminal while waiting for agent responses
    setTerminalOutput('Thinking...');

    try {
      const response = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userInput })
      });

      const data = await response.json();
      // Parse all agent names from query_type (comma-separated)
      const agentNames = (data.query_type || '').split(',').map(a => a.trim()).filter(Boolean);
      const agentNameToNodeId = {
        'FlightCheckerAgent': 'flight',
        'TouristAttractionAgent': 'tourist',
        'WeatherAgent': 'weather',
        'NewsAgent': 'news',
        'SentimentPopularityAgent': 'sentiment',
        'FoodPlannerAgent': 'food',
        'EmergencyAlertAgent': 'emergency',
        'TrafficConditionAgent': 'traffic',
        'ChatAgent': 'chat',
      };
      let agentResponses = {};
      let hasAgentResponses = typeof data.agent_responses === 'object' && data.agent_responses !== null;
      if (hasAgentResponses) {
        agentResponses = data.agent_responses;
      }
      // Always use the summary field from backend for chat display
      let summaryContent = data.summary || data.response || 'No response';

      // Show agents being invoked in terminal
      setTerminalOutput(
        agentNames.length > 0
          ? `Invoking agents: ${agentNames.join(', ')}\n\n`
          : ''
      );

      // Animate router, then each agent one by one
      let delay = 0;
      setExecutionPath([]); // All gray
      setTimeout(() => setExecutionPath(['router']), delay += 800); // router active
      agentNames.forEach((agent, idx) => {
        const nodeId = agentNameToNodeId[agent] || agent.toLowerCase();
        setTimeout(() => setExecutionPath(['router', nodeId]), delay += 1200);
        setTimeout(() => setExecutionPath(['router']), delay += 800);
      });

      // Show all agent responses in terminal after invocation
      setTimeout(() => {
        let allResponses = '';
        let uniqueResponses = new Set();
        // Collect all agent responses and summary
        let responseBlocks = [];
        if (hasAgentResponses && Object.keys(agentResponses).length > 0) {
          Object.entries(agentResponses).forEach(([agent, resp], idx, arr) => {
            responseBlocks.push({ agent, resp });
          });
        }
        // Add summary as a block if not already present
        if (summaryContent && (!responseBlocks.some(b => b.resp === summaryContent))) {
          responseBlocks.push({ agent: 'Summary', resp: summaryContent });
        }
        // Only show unique responses
        responseBlocks.forEach(({ agent, resp }, idx) => {
          if (!uniqueResponses.has(resp)) {
            if (agent !== 'Summary') {
              allResponses += `\n[${agent} is answering...]\n--- ${agent} ---\n${resp}\n`;
            } else {
              allResponses += `\n${resp}`;
            }
            uniqueResponses.add(resp);
          }
        });
        setTerminalOutput(prev => prev + allResponses);
        setExecutionPath([]);
        setMessages(prev => [
          ...prev,
          {
            type: 'bot',
            content: summaryContent,
            agent: 'LLM Router',
            executionTime: data.executionTime || 'N/A',
          }
        ]);
        setIsLoading(false);
      }, delay + 800);
    } catch (error) {
      const errorMessage = { 
        type: 'error', 
        content: 'Failed to connect to Python backend. Make sure your server is running on localhost:8000' 
      };
      setMessages(prev => [...prev, errorMessage]);
      setIsLoading(false);
    }

    setUserInput('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Connection-related functions removed for better responsiveness

  return (
    <div className="workflow-container" style={{ position: 'relative', height: '100vh', overflow: 'hidden' }}>
      {/* Left Panel - Workflow Visualization and Terminal stacked */}
      <div className="left-panel" style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        {/* Header */}
        <div className="header">
          <div className="header-content">
            <div>
              <h1 className="header-title">
                <Bot className="w-6 h-6" />
                LangGraph Workflow
              </h1>
              <p className="header-subtitle">Multi-agent routing system</p>
            </div>
            <div className="connection-status">
              <div className={`status-dot ${isConnected ? 'status-connected' : 'status-disconnected'}`}></div>
              <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
            </div>
          </div>
        </div>


        {/* Responsive Workflow Canvas using CSS Grid (80vh) */}
        <div
          className="workflow-canvas"
          style={{
            height: '75vh',
            width: '100%',
            marginTop: '50px',
            position: 'relative',
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gridTemplateRows: 'repeat(3, 1fr)',
            alignItems: 'center',
            justifyItems: 'center',
            overflow: 'auto',
          }}
          ref={canvasRef}
        >
          {/* SVG Connections (drawn after layout) */}
          <svg
            width="100%"
            height="100%"
            style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', zIndex: 1 }}
          >
            {Object.entries(nodeRefs).length > 1 &&
              nodes.filter(n => n.id !== 'router').map((node) => {
                const fromRef = nodeRefs['router'];
                const toRef = nodeRefs[node.id];
                if (!fromRef.current || !toRef.current || !canvasRef.current) return null;
                const fromRect = fromRef.current.getBoundingClientRect();
                const toRect = toRef.current.getBoundingClientRect();
                const canvasRect = canvasRef.current.getBoundingClientRect();
                // Start from center of router node
                const x1 = fromRect.left + fromRect.width / 2 - canvasRect.left;
                const y1 = fromRect.top + fromRect.height / 2 - canvasRect.top;
                // End at left center of agent node
                const x2 = toRect.left - canvasRect.left;
                const y2 = toRect.top + toRect.height / 2 - canvasRect.top;
                const isActive = executionPath.includes(node.id);
                return (
                  <line
                    key={node.id}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={isActive ? '#22c55e' : '#ffffffff'}
                    strokeWidth={isActive ? 4 : 3}
                    strokeDasharray={isActive ? '8 6' : '6 6'}
                    style={{ opacity: isActive || executionPath.includes('router') ? 1 : 0.4, transition: 'stroke 0.3s'}}
                  />
                );
              })}
          </svg>

          {/* Nodes in grid cells, responsive */}
          {nodes.map((node, idx) => {
            const IconComponent = node.icon;
            const isActive = executionPath.includes(node.id);
            // Grid placement: router center left, agents distributed in grid
            const gridArea = {
              'router': { gridColumn: '2 / span 2', gridRow: 2 },
              'flight': { gridColumn: 1, gridRow: 2 },
              'tourist': { gridColumn: 2, gridRow: 1 },
              'weather': { gridColumn: 3, gridRow: 1 },
              'news': { gridColumn: 4, gridRow: 1 },
              'sentiment': { gridColumn: 4, gridRow: 2 },
              'food': { gridColumn: 4, gridRow: 3 },
              'emergency': { gridColumn: 3, gridRow: 3 },
              'traffic': { gridColumn: 1, gridRow: 3 },
              'chat': { gridColumn: 2, gridRow: 3 },
              'custom': { gridColumn: 1, gridRow: 1 },
            }[node.id] || { gridColumn: 1, gridRow: 1 };
            // Unique dark blue gradients for each node
            const nodeGradients = {
              router: 'linear-gradient(165deg, #4b4b4bff 0%, #0082beff 100%)', // white to light blue
              flight: 'linear-gradient(135deg, #232323ff 0%, #005544ff 100%)', // white to gray
              tourist: 'linear-gradient(135deg, #232323ff 0%, #300018ff 100%)', // white to light blue
              weather: 'linear-gradient(135deg, #232323ff 0%, #004062ff 100%)', // white to light sky
              news: 'linear-gradient(135deg, #232323ff 0%, #ffea00ff 100%)', // white to pale yellow
              sentiment: 'linear-gradient(135deg, #232323ff 0%, #69003cff 100%)', // white to pink
              food: 'linear-gradient(135deg, #232323ff 0%, #00581fff 100%)', // white to mint
              emergency: 'linear-gradient(135deg, #232323ff 0%, #792727ff 100%)', // white to light red
              traffic: 'linear-gradient(135deg, #232323ff 0%, #4c005fff 100%)', // white to light gold
              chat: 'linear-gradient(135deg, #232323ff 0%, #643a00ff 100%)', // white to light blue
              custom: 'linear-gradient(135deg, #232323ff 0%, #5b000fff 100%)', // white to lavender
            };
            let nodeStyle = {
              gridColumn: gridArea.gridColumn,
              gridRow: gridArea.gridRow,
              width: node.id === 'router' ? 260 : 140,
              height: node.id === 'router' ? 90 : 60,
              padding: '18px',
              background: isActive ? 'linear-gradient(135deg, #ffffffff 0%, #ffffffff 100%)' : nodeGradients[node.id],
              color: isActive ? '#000000ff' : '#ffffff',
              borderRadius: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: node.id === 'router' ? 16 : 12,
              boxShadow: isActive ? '0 4px 24px rgba(239,68,68,0.15)' : '0 2px 8px rgba(0,0,0,0.08)',
              border: isActive ? '3px solid #ffffffff' : '3px solid #ffffff70',
              zIndex: isActive ? 10 : 2,
              cursor: 'pointer',
              opacity: 1,
              transition: 'all 0.3s',
              position: 'relative',
            };
            return (
              <div
                key={node.id}
                ref={nodeRefs[node.id]}
                style={nodeStyle}
                onClick={() => setSelectedNode(selectedNode === node.id ? null : node.id)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                  <IconComponent style={{ width: 30, height: 30, color: isActive ? '#000000ff' : '#ffffffff' }} />
                  <span>{node.label}</span>
                </div>
              </div>
            );
          })}



          {/* Node Details */}
          {selectedNode && (
            <div className="node-details" style={{ left: 350, top: 500, position: 'absolute', zIndex: 20 }}>
              <h3 className="details-title">
                {nodes.find(n => n.id === selectedNode)?.label}
              </h3>
              <p className="details-description">
                {nodes.find(n => n.id === selectedNode)?.description}
              </p>
              <pre className="details-code">
                {nodes.find(n => n.id === selectedNode)?.details}
              </pre>
            </div>
          )}

          {/* Execution Status */}
          {executionPath.length > 0 && (
            <div className="execution-status">
              <div className="status-indicator"></div>
              Executing workflow...
            </div>
          )}
        </div>
        {/* Terminal Output Overlay (40vh, bottom) */}
        <div style={{
          height: '25vh',
          background: '#000000ff',
          color: '#ffffffff',
          fontFamily: 'monospace',
          fontSize: '1rem',
          borderTop: '2px solid #333',
          boxShadow: '0 -2px 16px rgba(0,0,0,0.2)',
          zIndex: 10,
          padding: '1rem',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
        }}>
          <div style={{ fontWeight: 700, marginBottom: '0.5rem', color: '#fff' }}>Python Terminal Output</div>
          <div style={{ marginBottom: '0.5rem', color: terminalConnected === true ? '#00471aff' : '#440000ff', fontWeight: 600 }}>
            {terminalConnected === true && 'Terminal connected successfully'}
            {terminalConnected === false && 'Terminal not connected'}
          </div>
          {/* Color-coded agent responses in terminal */}
          {terminalOutput && (
            <div style={{ marginTop: '1rem', flex: 1, overflowY: 'auto' }}>
              {/* Show terminal output exactly as in Python terminal, no parsing or coloring */}
              <pre style={{ whiteSpace: 'pre-wrap', margin: 0, color: '#137b00ff' }}>{terminalOutput.trim()}</pre>
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Chat Interface */}
      <div className="right-panel">
        {/* Chat Header */}
        <div className="chat-header">
          <h2 className="chat-title">
            <MessageSquare className="w-5 h-5" />
            Live Chat
          </h2>
          <p className="chat-subtitle">Python LangGraph Chat</p>
        </div>

        {/* Messages */}
        <div className="messages-container">
          {messages.length === 0 && (
            <div className="empty-state">
              <Activity className="empty-icon" />
              <p>Start chatting to see the workflow in action!</p>
            </div>
          )}
          {messages.map((msg, idx) => (
            <div key={idx} className={`message-wrapper ${msg.type === 'user' ? 'message-user' : 'message-bot'}`}>
              <div className="message-avatar">
                {msg.type === 'user' ? <Smile size={22} /> : <Bot size={22} />}
              </div>
              <div className={`message-bubble ${
                msg.type === 'user' ? 'bubble-user' : 
                msg.type === 'error' ? 'bubble-error' : 'bubble-bot'
              }`}>
                {/* Show 'Summary' label for LLM router */}
                {msg.type === 'bot' && (
                  <div style={{ fontWeight: 700, color: '#22c55e', marginBottom: 4 }}>
                    Response
                  </div>
                )}
                <p>{msg.content}</p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="loading-message">
              <div className="message-avatar"><Bot size={22} /></div>
              <div className="loading-bubble">
                <div className="loading-content">
                  <div className="loading-spinner"></div>
                  <span>Processing...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="input-container">
          <div className="input-row">
            <input
              className="message-input"
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={isConnected ? "Ask me anything..." : "Backend not connected"}
              disabled={!isConnected || isLoading}
            />
            <button
              onClick={sendMessage}
              disabled={!isConnected || isLoading || !userInput.trim()}
              className="send-button"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default LangGraphVisualizer;