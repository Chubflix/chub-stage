import React, { useState, useEffect, useCallback } from 'react';
import { Stage, DebugLogEntry } from './Stage';
import testInitData from './assets/test-init.json';

/**
 * TestRunner for local development of the Next Episode stage
 * 
 * This component simulates the Chub chat environment for testing.
 * It provides controls to simulate various chat events and displays
 * debug output from all stage lifecycle events.
 */
export const TestRunner: React.FC = () => {
    const [stage, setStage] = useState<Stage | null>(null);
    const [renderKey, setRenderKey] = useState(0);
    const [debugLog, setDebugLog] = useState<DebugLogEntry[]>([]);
    const [userInput, setUserInput] = useState('');
    const [aiInput, setAiInput] = useState('');
    
    // Force re-render
    const forceRender = useCallback(() => {
        setRenderKey(prev => prev + 1);
    }, []);

    const updateDebugLog = () => {
        if (stage) {
            setDebugLog(stage.getDebugLog());
        }
    }

    // Initialize the stage
    useEffect(() => {
        const initData = testInitData as any;
        const stageInstance = new Stage(initData);
        
        // Set up debug update callback
        stageInstance.onDebugUpdate = () => {
            updateDebugLog();
            forceRender();
        };
        
        // Load the stage
        stageInstance.load().then(() => {
            setStage(stageInstance);
            updateDebugLog();
        });
    }, [forceRender]);
    
    // Simulate beforePrompt (user sends a message)
    const simulateBeforePrompt = async () => {
        if (stage && userInput.trim()) {
            await stage.beforePrompt({
                content: userInput,
                is_user: true,
                anonymous_id: 'test-user',
                name: 'User'
            } as any);

            updateDebugLog();
            setUserInput(''); // Clear input after sending
            forceRender();
        }
    };
    
    // Simulate afterResponse (bot responds)
    const simulateAfterResponse = async () => {
        if (stage && aiInput.trim()) {
            await stage.afterResponse({
                content: aiInput,
                is_user: false,
                anonymous_id: 'test-bot',
                name: 'Sofia Mendes'
            } as any);

            updateDebugLog();
            setAiInput(''); // Clear input after sending
            forceRender();
        }
    };
    
    // Simulate setState (user swipes/jumps to different message)
    const simulateSetState = async (episodeIndex: number) => {
        if (stage) {
            await stage.setState({
                currentEpisode: episodeIndex,
                startedAt: Date.now()
            });

            updateDebugLog();
            forceRender();
        }
    };
    
    // Clear debug log
    const clearDebugLog = () => {
        if (stage) {
            stage.clearDebugLog();
            setDebugLog([]);
        }
    };
    
    // Handle Enter key for inputs
    const handleUserKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            simulateBeforePrompt();
        }
    };
    
    const handleAiKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            simulateAfterResponse();
        }
    };
    
    // Format timestamp
    const formatTime = (timestamp: number) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('en-US', { 
            hour12: false, 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit',
        });
    };
    
    // Get event color
    const getEventColor = (event: string) => {
        if (event.includes('beforePrompt')) return '#4a9eff';
        if (event.includes('afterResponse')) return '#4ade80';
        if (event.includes('setState')) return '#f59e0b';
        if (event.includes('constructor')) return '#a855f7';
        if (event.includes('load')) return '#ec4899';
        if (event.includes('Episode')) return '#06b6d4';
        return '#94a3b8';
    };
    
    if (!stage) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100vh',
                backgroundColor: '#141414',
                color: '#fff'
            }}>
                Loading stage...
            </div>
        );
    }
    
    return (
        <div style={{
            display: 'flex',
            height: '100vh',
            backgroundColor: '#0a0a0a'
        }}>
            {/* Stage preview */}
            <div style={{
                width: '320px',
                height: '100%',
                borderRight: '1px solid #333',
                flexShrink: 0
            }}>
                <div key={renderKey} style={{ height: '100%' }}>
                    {stage.render()}
                </div>
            </div>
            
            {/* Test controls and debug output */}
            <div style={{
                flex: 1,
                padding: '20px',
                color: '#fff',
                overflow: 'auto',
                display: 'flex',
                flexDirection: 'column'
            }}>
                <h1 style={{ marginTop: 0, marginBottom: '16px' }}>
                    Next Episode Stage - Debug Runner
                </h1>
                
                {/* Message Inputs */}
                <div style={{ marginBottom: '20px' }}>
                    <h2 style={{ fontSize: '16px', marginBottom: '12px' }}>Send Messages</h2>
                    
                    {/* User Message Input */}
                    <div style={{ marginBottom: '12px' }}>
                        <label style={{ 
                            display: 'block', 
                            fontSize: '12px', 
                            color: '#4a9eff',
                            marginBottom: '4px',
                            fontWeight: 'bold'
                        }}>
                            📤 User Message (beforePrompt)
                        </label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <textarea
                                value={userInput}
                                onChange={(e) => setUserInput(e.target.value)}
                                onKeyDown={handleUserKeyDown}
                                placeholder="Type a user message and press Enter or click Send..."
                                style={{
                                    flex: 1,
                                    padding: '10px',
                                    fontSize: '14px',
                                    backgroundColor: '#1a1a1a',
                                    color: '#fff',
                                    border: '1px solid #4a9eff',
                                    borderRadius: '4px',
                                    resize: 'vertical',
                                    minHeight: '60px',
                                    fontFamily: 'inherit'
                                }}
                            />
                            <button
                                onClick={simulateBeforePrompt}
                                disabled={!userInput.trim()}
                                style={{
                                    padding: '10px 20px',
                                    fontSize: '14px',
                                    cursor: userInput.trim() ? 'pointer' : 'not-allowed',
                                    backgroundColor: userInput.trim() ? '#4a9eff' : '#333',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '4px',
                                    alignSelf: 'flex-end'
                                }}
                            >
                                Send
                            </button>
                        </div>
                    </div>
                    
                    {/* AI Message Input */}
                    <div style={{ marginBottom: '12px' }}>
                        <label style={{ 
                            display: 'block', 
                            fontSize: '12px', 
                            color: '#4ade80',
                            marginBottom: '4px',
                            fontWeight: 'bold'
                        }}>
                            📥 AI Response (afterResponse)
                        </label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <textarea
                                value={aiInput}
                                onChange={(e) => setAiInput(e.target.value)}
                                onKeyDown={handleAiKeyDown}
                                placeholder="Type an AI response and press Enter or click Send..."
                                style={{
                                    flex: 1,
                                    padding: '10px',
                                    fontSize: '14px',
                                    backgroundColor: '#1a1a1a',
                                    color: '#fff',
                                    border: '1px solid #4ade80',
                                    borderRadius: '4px',
                                    resize: 'vertical',
                                    minHeight: '60px',
                                    fontFamily: 'inherit'
                                }}
                            />
                            <button
                                onClick={simulateAfterResponse}
                                disabled={!aiInput.trim()}
                                style={{
                                    padding: '10px 20px',
                                    fontSize: '14px',
                                    cursor: aiInput.trim() ? 'pointer' : 'not-allowed',
                                    backgroundColor: aiInput.trim() ? '#4ade80' : '#333',
                                    color: aiInput.trim() ? '#000' : '#fff',
                                    border: 'none',
                                    borderRadius: '4px',
                                    alignSelf: 'flex-end'
                                }}
                            >
                                Send
                            </button>
                        </div>
                    </div>
                </div>
                
                {/* Swipe Controls */}
                <div style={{ marginBottom: '20px' }}>
                    <h2 style={{ fontSize: '16px', marginBottom: '12px' }}>Swipe / Jump to Episode (setState)</h2>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        {[0, 1, 2, 3, 4, 5, 6].map(i => (
                            <button
                                key={i}
                                onClick={() => simulateSetState(i)}
                                style={{
                                    padding: '8px 16px',
                                    fontSize: '14px',
                                    cursor: 'pointer',
                                    backgroundColor: '#f59e0b',
                                    color: '#000',
                                    border: 'none',
                                    borderRadius: '4px',
                                    fontWeight: 'bold'
                                }}
                            >
                                Episode {i + 1}
                            </button>
                        ))}
                    </div>
                </div>
                
                {/* Test Data */}
                <div style={{ marginBottom: '20px' }}>
                    <h2 style={{ fontSize: '16px', marginBottom: '12px' }}>Test Data</h2>
                    <pre style={{
                        backgroundColor: '#1a1a1a',
                        padding: '10px',
                        borderRadius: '4px',
                        overflow: 'auto',
                        maxHeight: '120px',
                        fontSize: '11px',
                        margin: 0
                    }}>
                        {JSON.stringify(testInitData, null, 2)}
                    </pre>
                </div>
                
                {/* Debug Log */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '200px' }}>
                    <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        marginBottom: '12px'
                    }}>
                        <h2 style={{ fontSize: '16px', margin: 0 }}>
                            Debug Log ({debugLog.length} events)
                        </h2>
                        <button
                            onClick={clearDebugLog}
                            style={{
                                padding: '6px 12px',
                                fontSize: '12px',
                                cursor: 'pointer',
                                backgroundColor: '#ef4444',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '4px'
                            }}
                        >
                            Clear Log
                        </button>
                    </div>
                    
                    <div style={{
                        flex: 1,
                        backgroundColor: '#1a1a1a',
                        borderRadius: '4px',
                        overflow: 'auto',
                        padding: '10px'
                    }}>
                        {debugLog.length === 0 ? (
                            <div style={{ 
                                color: '#666', 
                                textAlign: 'center', 
                                padding: '20px',
                                fontSize: '14px'
                            }}>
                                No events logged yet. Use the inputs above to send messages.
                            </div>
                        ) : (
                            [...debugLog].reverse().map((entry, index) => (
                                <div 
                                    key={debugLog.length - 1 - index}
                                    style={{
                                        marginBottom: '12px',
                                        paddingBottom: '12px',
                                        borderBottom: index < debugLog.length - 1 ? '1px solid #333' : 'none'
                                    }}
                                >
                                    <div style={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: '8px',
                                        marginBottom: '6px'
                                    }}>
                                        <span style={{ 
                                            fontSize: '11px', 
                                            color: '#666',
                                            fontFamily: 'monospace'
                                        }}>
                                            {formatTime(entry.timestamp)}
                                        </span>
                                        <span style={{
                                            fontSize: '12px',
                                            fontWeight: 'bold',
                                            color: getEventColor(entry.event),
                                            backgroundColor: `${getEventColor(entry.event)}20`,
                                            padding: '2px 8px',
                                            borderRadius: '4px'
                                        }}>
                                            {entry.event}
                                        </span>
                                    </div>
                                    <pre style={{
                                        fontSize: '11px',
                                        margin: 0,
                                        whiteSpace: 'pre-wrap',
                                        wordBreak: 'break-word',
                                        color: '#e2e8f0',
                                        fontFamily: 'monospace',
                                        lineHeight: '1.4'
                                    }}>
                                        {JSON.stringify(entry.data, null, 2)}
                                    </pre>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TestRunner;
