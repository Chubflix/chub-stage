import React from 'react';
import {
    InitialData,
    LoadResponse,
    StageBase,
    StageResponse,
    Message,
    Character
} from "@chub-ai/stages-ts";

/**
 * Chubflix Next Episode Stage - Debug Version
 * 
 * This version captures and displays all data received from ChubAI
 * during stage lifecycle events for debugging purposes.
 */

// ===== TYPE DEFINITIONS =====

type InitStateType = {
    totalEpisodes: number;
    characterName: string;
    episodeTitles: string[];
};

type MessageStateType = {
    currentEpisode: number;
    startedAt: number;
    // Store debug data in message state so it persists
    lastEvent?: string;
    lastData?: unknown;
};

type ChatStateType = {
    highestEpisodeReached: number;
    completed: boolean;
};

type ConfigType = {
    showEpisodeNumber: boolean;
    showProgress: boolean;
    buttonText: string;
    injectContext: boolean;
    theme: 'dark' | 'light' | 'chubflix';
};

// Debug log entry type
export type DebugLogEntry = {
    timestamp: number;
    event: string;
    data: unknown;
};

// ===== MAIN STAGE CLASS =====

export class Stage extends StageBase<
    InitStateType,
    ChatStateType,
    MessageStateType,
    ConfigType
> {
    // Debug log - stores all events (kept in memory for display)
    private debugLog: DebugLogEntry[] = [];

    public onDebugUpdate?: (logEntry: DebugLogEntry) => void;
    
    // Internal state
    private currentEpisode: number = 0;
    private totalEpisodes: number = 1;
    private episodeTitles: string[] = [];
    private characterName: string = '';
    private highestEpisodeReached: number = 0;
    private completed: boolean = false;
    
    private config: ConfigType = {
        showEpisodeNumber: true,
        showProgress: true,
        buttonText: 'Next Episode',
        injectContext: true,
        theme: 'chubflix'
    };

    constructor(data: InitialData<InitStateType, ChatStateType, MessageStateType, ConfigType>) {
        super(data);
        
        // Log constructor data
        this.addDebugLog('constructor', {
            characters: data.characters,
            users: data.users,
            config: data.config,
            initState: data.initState,
            chatState: data.chatState,
            messageState: data.messageState
        });
        
        if (data.config) {
            this.config = { ...this.config, ...data.config };
        }
        
        const characters = data.characters || [];
        if (Array.isArray(characters) && characters.length > 0) {
            const mainChar = characters[0] as Character & { 
                first_mes?: string; 
                alternate_greetings?: string[];
                name?: string;
            };
            this.characterName = mainChar.name || 'Character';
            this.totalEpisodes = 1;
            if (mainChar.alternate_greetings && Array.isArray(mainChar.alternate_greetings)) {
                this.totalEpisodes += mainChar.alternate_greetings.length;
            }
            this.episodeTitles = this.extractEpisodeTitles(mainChar);
        }
    }

    public getDebugLog(): DebugLogEntry[] {
        return this.debugLog;
    }

    public clearDebugLog(): void {
        this.debugLog = [];
    }

    public addDebugLog(event: string, data: unknown): void {
        let logEntry: DebugLogEntry = {
            timestamp: Date.now(),
            event,
            data
        };
        this.debugLog.push(logEntry);

        if (this.onDebugUpdate !== undefined) {
            this.onDebugUpdate(logEntry);
        }

        console.log(logEntry);
        
        // Keep only last 50 entries to prevent memory issues
        if (this.debugLog.length > 50) {
            this.debugLog = this.debugLog.slice(-50);
        }
    }

    async load(): Promise<Partial<LoadResponse<InitStateType, ChatStateType, MessageStateType>>> {
        const response = {
            success: true,
            error: null,
            initState: {
                totalEpisodes: this.totalEpisodes,
                characterName: this.characterName,
                episodeTitles: this.episodeTitles
            },
            chatState: {
                highestEpisodeReached: this.highestEpisodeReached,
                completed: this.completed
            }
        };
        
        this.addDebugLog('load', { response });
        
        return response;
    }

    async beforePrompt(userMessage: Message): Promise<Partial<StageResponse<ChatStateType, MessageStateType>>> {
        // Log the incoming user message with ALL its data
        this.addDebugLog('beforePrompt', {
            userMessage: userMessage,
            currentState: {
                currentEpisode: this.currentEpisode,
                totalEpisodes: this.totalEpisodes,
                highestEpisodeReached: this.highestEpisodeReached,
                completed: this.completed
            }
        });
        
        let addSystem: string | null = null;
        
        if (this.config.injectContext) {
            const episodeTitle = this.episodeTitles[this.currentEpisode] || `Episode ${this.currentEpisode + 1}`;
            addSystem = `[Chubflix Episode Context: Currently on ${episodeTitle} (${this.currentEpisode + 1}/${this.totalEpisodes}). Maintain narrative continuity with previous episodes.]`;
        }
        
        const response = {
            stateMessage: `Episode ${this.currentEpisode + 1}/${this.totalEpisodes}`,
            messageState: {
                currentEpisode: this.currentEpisode,
                startedAt: Date.now(),
                lastEvent: 'beforePrompt',
                lastData: userMessage
            },
            chatState: {
                highestEpisodeReached: Math.max(this.highestEpisodeReached, this.currentEpisode),
                completed: this.completed
            },
            modifiedMessage: null,
            systemMessage: addSystem,
        };
        
        this.addDebugLog('beforePrompt_response', { response });
        
        return response;
    }

    async afterResponse(botMessage: Message): Promise<Partial<StageResponse<ChatStateType, MessageStateType>>> {
        // Log the incoming bot message with ALL its data
        this.addDebugLog('afterResponse', {
            botMessage: botMessage,
            currentState: {
                currentEpisode: this.currentEpisode,
                totalEpisodes: this.totalEpisodes,
                highestEpisodeReached: this.highestEpisodeReached,
                completed: this.completed
            }
        });
        
        const response = {
            stateMessage: `Episode ${this.currentEpisode + 1}/${this.totalEpisodes}`,
            messageState: {
                currentEpisode: this.currentEpisode,
                startedAt: Date.now(),
                lastEvent: 'afterResponse',
                lastData: botMessage
            },
            chatState: {
                highestEpisodeReached: Math.max(this.highestEpisodeReached, this.currentEpisode),
                completed: this.currentEpisode >= this.totalEpisodes - 1
            },
            modifiedMessage: null,
            systemMessage: null
        };
        
        this.addDebugLog('afterResponse_response', { response });
        
        return response;
    }

    async setState(state: MessageStateType): Promise<void> {
        // Log the state change (swipe/jump)
        this.addDebugLog('setState', {
            newState: state,
            previousState: {
                currentEpisode: this.currentEpisode
            }
        });
        
        if (state) {
            this.currentEpisode = state.currentEpisode || 0;
        }
    }

    private extractEpisodeTitles(character: Character & { first_mes?: string; alternate_greetings?: string[] }): string[] {
        const titles: string[] = [];
        
        if (character.first_mes) {
            const title = this.extractTitleFromGreeting(character.first_mes);
            titles.push(title || 'Episode 1');
        }
        
        if (character.alternate_greetings && Array.isArray(character.alternate_greetings)) {
            character.alternate_greetings.forEach((greeting: string, index: number) => {
                const title = this.extractTitleFromGreeting(greeting);
                titles.push(title || `Episode ${index + 2}`);
            });
        }
        
        return titles;
    }
    
    private extractTitleFromGreeting(greeting: string): string | null {
        const patterns = [
            /^\*\*([^*]+)\*\*/,
            /^#\s+(.+?)(?:\n|$)/,
            /^"([^"]+)"/,
            /^Episode\s+\d+:\s*(.+?)(?:\n|$)/i
        ];
        
        for (const pattern of patterns) {
            const match = greeting.trim().match(pattern);
            if (match) {
                return match[1].trim();
            }
        }
        
        const firstLine = greeting.trim().split('\n')[0];
        if (firstLine && firstLine.length <= 50) {
            return firstLine.replace(/[*#"]/g, '').trim();
        }
        
        return null;
    }
    
    private goToNextEpisode(): void {
        if (this.currentEpisode < this.totalEpisodes - 1) {
            this.currentEpisode++;
            this.highestEpisodeReached = Math.max(this.highestEpisodeReached, this.currentEpisode);
            
            if (this.currentEpisode >= this.totalEpisodes - 1) {
                this.completed = true;
            }
            
            this.addDebugLog('goToNextEpisode', {
                newEpisode: this.currentEpisode,
                highestEpisodeReached: this.highestEpisodeReached,
                completed: this.completed
            });
        }
    }
    
    private goToPreviousEpisode(): void {
        if (this.currentEpisode > 0) {
            this.currentEpisode--;
            
            this.addDebugLog('goToPreviousEpisode', {
                newEpisode: this.currentEpisode
            });
        }
    }
    
    // Format timestamp for display
    private formatTime(timestamp: number): string {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('en-US', { 
            hour12: false, 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit'
        });
    }
    
    // Get event color
    private getEventColor(event: string): string {
        if (event.includes('beforePrompt')) return '#4a9eff';
        if (event.includes('afterResponse')) return '#4ade80';
        if (event.includes('setState')) return '#f59e0b';
        if (event.includes('constructor')) return '#a855f7';
        if (event.includes('load')) return '#ec4899';
        if (event.includes('Episode')) return '#06b6d4';
        return '#94a3b8';
    }

    render(): React.ReactElement {
        const isFirstEpisode = this.currentEpisode === 0;
        const isLastEpisode = this.currentEpisode >= this.totalEpisodes - 1;
        const progress = ((this.currentEpisode + 1) / this.totalEpisodes) * 100;
        const currentTitle = this.episodeTitles[this.currentEpisode] || `Episode ${this.currentEpisode + 1}`;
        
        return (
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                padding: '12px',
                backgroundColor: '#141414',
                color: '#ffffff',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                boxSizing: 'border-box',
                overflow: 'hidden'
            }}>
                {/* Header */}
                <div style={{
                    fontSize: '10px',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    opacity: 0.7,
                    marginBottom: '4px'
                }}>
                    {this.characterName}
                </div>
                
                {/* Episode title */}
                <div style={{
                    fontSize: '14px',
                    fontWeight: 'bold',
                    marginBottom: '8px',
                    lineHeight: '1.3'
                }}>
                    {currentTitle}
                </div>
                
                {/* Episode number & progress */}
                {this.config.showEpisodeNumber && (
                    <div style={{
                        fontSize: '12px',
                        opacity: 0.8,
                        marginBottom: '8px'
                    }}>
                        Episode {this.currentEpisode + 1} of {this.totalEpisodes}
                    </div>
                )}
                
                {this.config.showProgress && (
                    <div style={{ marginBottom: '12px' }}>
                        <div style={{
                            height: '3px',
                            backgroundColor: 'rgba(255,255,255,0.2)',
                            borderRadius: '2px',
                            overflow: 'hidden'
                        }}>
                            <div style={{
                                height: '100%',
                                width: `${progress}%`,
                                backgroundColor: '#e50914',
                                borderRadius: '2px',
                                transition: 'width 0.3s ease'
                            }} />
                        </div>
                    </div>
                )}
                
                {/* Navigation buttons */}
                <div style={{
                    display: 'flex',
                    gap: '6px',
                    marginBottom: '12px'
                }}>
                    <button
                        onClick={() => this.goToPreviousEpisode()}
                        disabled={isFirstEpisode}
                        style={{
                            flex: 1,
                            padding: '8px',
                            fontSize: '11px',
                            fontWeight: '600',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: isFirstEpisode ? 'not-allowed' : 'pointer',
                            backgroundColor: isFirstEpisode ? '#444' : '#e50914',
                            color: '#ffffff',
                            opacity: isFirstEpisode ? 0.5 : 1
                        }}
                    >
                        ← Prev
                    </button>
                    
                    <button
                        onClick={() => this.goToNextEpisode()}
                        disabled={isLastEpisode}
                        style={{
                            flex: 2,
                            padding: '8px',
                            fontSize: '11px',
                            fontWeight: '600',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: isLastEpisode ? 'not-allowed' : 'pointer',
                            backgroundColor: isLastEpisode ? '#444' : '#e50914',
                            color: '#ffffff',
                            opacity: isLastEpisode ? 0.5 : 1
                        }}
                    >
                        {isLastEpisode ? 'Final' : 'Next →'}
                    </button>
                </div>
                
                {/* Debug Log Section */}
                <div style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    minHeight: 0,
                    borderTop: '1px solid #333',
                    paddingTop: '8px'
                }}>
                    <div style={{
                        fontSize: '10px',
                        fontWeight: 'bold',
                        marginBottom: '6px',
                        color: '#888'
                    }}>
                        DEBUG LOG ({this.debugLog.length} events)
                    </div>
                    
                    <div style={{
                        flex: 1,
                        overflow: 'auto',
                        backgroundColor: '#0a0a0a',
                        borderRadius: '4px',
                        padding: '6px',
                        fontSize: '9px',
                        fontFamily: 'monospace'
                    }}>
                        {this.debugLog.length === 0 ? (
                            <div style={{ color: '#666', textAlign: 'center', padding: '10px' }}>
                                Waiting for events...
                            </div>
                        ) : (
                            [...this.debugLog].reverse().map((entry, index) => (
                                <div 
                                    key={this.debugLog.length - 1 - index}
                                    style={{
                                        marginBottom: '8px',
                                        paddingBottom: '8px',
                                        borderBottom: '1px solid #222'
                                    }}
                                >
                                    <div style={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: '4px',
                                        marginBottom: '4px'
                                    }}>
                                        <span style={{ color: '#666' }}>
                                            {this.formatTime(entry.timestamp)}
                                        </span>
                                        <span style={{
                                            color: this.getEventColor(entry.event),
                                            fontWeight: 'bold'
                                        }}>
                                            {entry.event}
                                        </span>
                                    </div>
                                    <pre style={{
                                        margin: 0,
                                        whiteSpace: 'pre-wrap',
                                        wordBreak: 'break-all',
                                        color: '#ccc',
                                        lineHeight: '1.3',
                                        maxHeight: '150px',
                                        overflow: 'auto'
                                    }}>
                                        {JSON.stringify(entry.data, null, 1)}
                                    </pre>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        );
    }
}
