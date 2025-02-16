declare global {
    interface Window {
        webkitSpeechRecognition: any;
        SpeechRecognition: any;
    }
}

import {
    ArrowRightLeft,
    Grid as Bridge,
    Coins as Coin,
    Mic,
    PiggyBank,
    Power,
    RotateCcw,
    Send,
    X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useAccount, useConnect, useChainId } from 'wagmi';

interface LoadingScreenProps {
    progress: number;
    message: string;
    onConnectionComplete: () => void;
}

function LoadingScreen({ progress, message, onConnectionComplete }: LoadingScreenProps) {
    const { isConnected } = useAccount();
    const { connect, connectors, isPending } = useConnect();
    const chainId = useChainId();
    const [showConnect, setShowConnect] = useState(false);
    const [isConnectionPending, setIsConnectionPending] = useState(false);

    useEffect(() => {
        if (isConnected && chainId === 31337) {
            onConnectionComplete();
        }
    }, [isConnected, chainId, onConnectionComplete]);

    useEffect(() => {
        if (progress >= 50) {
            setShowConnect(true);
        }
    }, [progress]);

    const handleConnect = async () => {
        setIsConnectionPending(true);
        const injectedConnector = connectors.find(c => c.id === 'injected');
        if (injectedConnector) {
            try {
                await connect({ connector: injectedConnector, chainId: 31337 });
            } catch (error) {
                console.error('Connection error:', error);
            }
        }
        setIsConnectionPending(false);
    };

    const getConnectionMessage = () => {
        if (isConnectionPending || isPending) return "Connecting to wallet...";
        if (isConnected && chainId !== 31337) {
            return "Please switch to Anvil network";
        }
        return message;
    };

    return (
        <div className="fixed inset-0 bg-[#1a0f2e] flex flex-col items-center justify-center z-50 transition-opacity duration-500">
            <div className="w-64 h-64 relative mb-8">
                <img src="/icon.png" alt="Icon" className="w-full h-full" />
            </div>
            <div className="w-80 h-8 bg-black/50 pixel-corners overflow-hidden mb-4">
                <div
                    className="h-full bg-[#fbd000] transition-all duration-300 progress-bar"
                    style={{ 
                        width: `${progress}%`,
                        opacity: isConnectionPending || (isConnected && chainId !== 31337) ? '0.5' : '1'
                    }}
                />
            </div>
            <p className="text-[#fbd000] text-lg mb-2">{progress}%</p>
            <p className="text-white/80 text-sm mb-6">{getConnectionMessage()}</p>
            {showConnect && !isConnected && (
                <div className="animate-bounce mt-4">
                    <button
                        onClick={handleConnect}
                        disabled={isConnectionPending || isPending}
                        className={`fire-button px-8 py-6 pixel-corners hover:brightness-110 transition-all text-lg uppercase tracking-wider flex items-center gap-3 ${
                            (isConnectionPending || isPending) ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                    >
                        <Power className="w-5 h-5" />
                        {(isConnectionPending || isPending) ? 'Connecting...' : 'Connect Wallet'}
                    </button>
                </div>
            )}
        </div>
    );
}

function App() {
    const [intent, setIntent] = useState("");
    const [logs, setLogs] = useState<{ time: string; message: string }[]>([]);
    const [isListening, setIsListening] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [progress, setProgress] = useState(0);
    const [loadingMessage, setLoadingMessage] = useState("Initializing...");
    const recognitionRef = useRef<any>(null);
    const { address, isConnected } = useAccount();
    const { connect, connectors, isPending } = useConnect();
    const chainId = useChainId();
    const [shouldContinueLoading, setShouldContinueLoading] = useState(false);
    const [connectionComplete, setConnectionComplete] = useState(false);

    const handleConnectionComplete = () => {
        setConnectionComplete(true);
        // Start from 50% after connection is complete
        setProgress(50);
    };

    useEffect(() => {
        if (!connectionComplete) {
            // Show initial loading progress up to 50%
            const interval = setInterval(() => {
                setProgress(prev => {
                    if (prev >= 50) {
                        clearInterval(interval);
                        return 50;
                    }
                    return prev + 1;
                });
            }, 50);
            return () => clearInterval(interval);
        }
    }, [connectionComplete]);

    useEffect(() => {
        if (!shouldContinueLoading) return;

        const loadingMessages = [
            "Initializing smart contracts...",
            "Syncing with metaverse...",
            "Loading pixel assets...",
            "Preparing your adventure...",
        ];

        let currentProgress = 50; // Start from 50% as first half is for wallet connection
        const interval = setInterval(() => {
            if (currentProgress >= 100) {
                clearInterval(interval);
                setTimeout(() => setIsLoading(false), 500);
                return;
            }

            currentProgress += Math.random() * 10;
            if (currentProgress > 100) currentProgress = 100;

            setProgress(Math.floor(currentProgress));
            setLoadingMessage(
                loadingMessages[
                    Math.floor(((currentProgress - 50) / 50) * loadingMessages.length)
                ]
            );

            if (currentProgress % 20 === 0) {
                const audio = new Audio(
                    "https://assets.mixkit.co/active_storage/sfx/2001/2001-preview.mp3"
                );
                audio.volume = 0.1;
                audio.play();
            }
        }, 300);

        return () => clearInterval(interval);
    }, [shouldContinueLoading]);

    useEffect(() => {
        // Continue loading only when connected and on correct network
        if (isConnected && chainId === 31337) {
            setShouldContinueLoading(true);
        } else {
            setShouldContinueLoading(false);
        }
    }, [isConnected, chainId]);

    useEffect(() => {
        if (!connectionComplete) return;

        const loadingMessages = [
            "Initializing smart contracts...",
            "Syncing with metaverse...",
            "Loading pixel assets...",
            "Preparing your adventure...",
        ];

        let currentProgress = 50;
        const interval = setInterval(() => {
            if (currentProgress >= 100) {
                clearInterval(interval);
                setTimeout(() => setIsLoading(false), 500);
                return;
            }

            currentProgress += Math.random() * 10;
            if (currentProgress > 100) currentProgress = 100;

            setProgress(Math.floor(currentProgress));
            setLoadingMessage(
                loadingMessages[
                    Math.floor(((currentProgress - 50) / 50) * loadingMessages.length)
                ]
            );

            if (currentProgress % 20 === 0) {
                const audio = new Audio(
                    "https://assets.mixkit.co/active_storage/sfx/2001/2001-preview.mp3"
                );
                audio.volume = 0.1;
                audio.play();
            }
        }, 300);

        return () => clearInterval(interval);
    }, [connectionComplete]);

    const startListening = () => {
        if ("SpeechRecognition" in window || "webkitSpeechRecognition" in window) {
            const SpeechRecognitionAPI = 
                (window as any).SpeechRecognition || 
                (window as any).webkitSpeechRecognition;
            
            recognitionRef.current = new SpeechRecognitionAPI();

            recognitionRef.current.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                setIntent(transcript);
                setIsListening(false);

                const audio = new Audio(
                    "https://assets.mixkit.co/active_storage/sfx/1997/1997-preview.mp3"
                );
                audio.volume = 0.2;
                audio.play();
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
            };

            recognitionRef.current.start();
            setIsListening(true);
        }
    };

    const handleFireIntent = () => {
        if (!isConnected) {
            const now = new Date();
            const time = now.toLocaleTimeString("en-US", {
                hour12: false,
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
            });

            setLogs((prev) => [
                ...prev,
                {
                    time,
                    message: "Error: Please connect your wallet first!",
                },
            ]);
            return;
        }

        const now = new Date();
        const time = now.toLocaleTimeString("en-US", {
            hour12: false,
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        });

        setLogs((prev) => [
            ...prev,
            {
                time,
                message: `Intent fired: ${intent}`,
            },
        ]);

        const audio = new Audio(
            "https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3"
        );
        audio.volume = 0.2;
        audio.play();
    };


    const suggestions = [
        {
            title: "Swap",
            icon: <ArrowRightLeft className="w-6 h-6" />,
            text: "Swap 10 USDC to WMATIC",
        },
        {
            title: "Send",
            icon: <Send className="w-6 h-6" />,
            text: "Send 5 ETH to wallet",
        },
        {
            title: "Bridge",
            icon: <Bridge className="w-6 h-6" />,
            text: "Bridge 100 USDC to Arbitrum",
        },
        {
            title: "Borrow",
            icon: <PiggyBank className="w-6 h-6" />,
            text: "Borrow 1000 USDC from Aave",
        },
        {
            title: "Repay",
            icon: <RotateCcw className="w-6 h-6" />,
            text: "Repay 500 USDC to Aave",
        },
    ];

    return (
        <>
            {isLoading && (
                <LoadingScreen 
                    progress={progress} 
                    message={loadingMessage} 
                    onConnectionComplete={handleConnectionComplete}
                />
            )}

            <div className="relative min-h-screen bg-gradient-to-b from-sky-400 to-sky-200 overflow-hidden">
                {/* Cloud container */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div
                        className="cloud"
                        style={{
                            position: "absolute",
                            top: "15%",
                            left: "-400px",
                            width: "400px",
                            height: "200px",
                            animation: "moveCloud 45s linear infinite",
                        }}
                    >
                        <img src="/cloud1.svg" alt="cloud" className="w-full h-full" />
                    </div>
                    <div
                        className="cloud"
                        style={{
                            position: "absolute",
                            top: "35%",
                            left: "-300px",
                            width: "300px",
                            height: "150px",
                            animation: "moveCloud 35s linear infinite",
                            animationDelay: "-15s",
                        }}
                    >
                        <img src="/cloud2.svg" alt="cloud" className="w-full h-full" />
                    </div>
                    <div
                        className="cloud"
                        style={{
                            position: "absolute",
                            top: "60%",
                            left: "-350px",
                            width: "350px",
                            height: "175px",
                            animation: "moveCloud 40s linear infinite",
                            animationDelay: "-25s",
                        }}
                    >
                        <img src="/cloud3.svg" alt="cloud" className="w-full h-full" />
                    </div>
                    <div
                        className="cloud"
                        style={{
                            position: "absolute",
                            top: "25%",
                            left: "-400px",
                            width: "400px",
                            height: "200px",
                            animation: "moveCloud 38s linear infinite",
                            animationDelay: "-8s",
                        }}
                    >
                        <img src="/cloud1.svg" alt="cloud" className="w-full h-full" />
                    </div>
                    <div
                        className="cloud"
                        style={{
                            position: "absolute",
                            top: "45%",
                            left: "-300px",
                            width: "300px",
                            height: "150px",
                            animation: "moveCloud 42s linear infinite",
                            animationDelay: "-32s",
                        }}
                    >
                        <img src="/cloud2.svg" alt="cloud" className="w-full h-full" />
                    </div>
                </div>

                <div className="min-h-screen mario-gradient text-white font-sans relative overflow-hidden">
                    <div className="absolute inset-0 parallax-background"></div>
                    <div className="ground-background"></div>
                    <div className="scanline"></div>

                    {/* Floating Platforms */}
                    <div className="platform" style={{ left: "10%", top: "20%" }}></div>
                    <div className="platform" style={{ left: "30%", top: "40%" }}></div>
                    <div className="platform" style={{ left: "60%", top: "30%" }}></div>
                    <div className="platform" style={{ left: "80%", top: "50%" }}></div>

                    {/* Floating Clouds */}
                    <div
                        className="cloud"
                        style={{
                            top: "15%",
                            animationDelay: "0s",
                            opacity: "0.4",
                            filter: "blur(1px)",
                        }}
                    ></div>
                    <div
                        className="cloud"
                        style={{
                            top: "35%",
                            animationDelay: "-15s",
                            opacity: "0.3",
                            filter: "blur(2px)",
                        }}
                    ></div>
                    <div
                        className="cloud"
                        style={{
                            top: "25%",
                            animationDelay: "-7s",
                            opacity: "0.2",
                            filter: "blur(3px)",
                        }}
                    ></div>

                    {/* Header */}
                    <header className="p-8 flex justify-between items-center border-b-[6px] border-[#e52521] relative z-10">
                        <div className="flex items-center gap-6">
                            <img src="/icon.png" alt="Icon" className="w-12 h-12" />
                            <h1 className="text-2xl text-[#fbd000] drop-shadow-[2px_2px_0_#e52521]">
                                INTENDO-64
                            </h1>
                        </div>

                        <div className="flex items-center gap-8 bg-[#e52521] p-6 pixel-corners mario-border">
                            {!isConnected ? (
                                <button
                                    onClick={() => {
                                        const injectedConnector = connectors.find(c => c.id === 'injected');
                                        if (injectedConnector) {
                                            connect({ connector: injectedConnector, chainId: 31337 });
                                        }
                                    }}
                                    className="flex items-center gap-4"
                                    disabled={isPending}
                                >
                                    <div className={`w-4 h-4 rounded-full ${isPending ? 'bg-yellow-500 shadow-[0_0_12px_rgba(234,179,8,0.5)]' : 'bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.5)]'}`}></div>
                                    <span className="text-sm text-white">{isPending ? 'Connecting...' : 'Connect Wallet'}</span>
                                </button>
                            ) : chainId !== 31337 ? (
                                <div className="flex items-center gap-4">
                                    <div className="w-4 h-4 bg-yellow-500 rounded-full shadow-[0_0_12px_rgba(234,179,8,0.5)]"></div>
                                    <span className="text-sm text-white">Wrong Network</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-4">
                                    <div className="w-4 h-4 bg-[#fbd000] rounded-full shadow-[0_0_12px_rgba(251,208,0,0.5)]"></div>
                                    <span className="text-sm text-white truncate max-w-[150px]">
                                        {address}
                                    </span>
                                </div>
                            )}
                        </div>
                    </header>

                    {/* Main Content */}
                    <main className="container mx-auto p-12 space-y-12 relative z-10">
                        {/* Intent Input */}
                        <div className="space-y-10">
                            <div className="bg-[#e52521] p-10 pixel-corners question-block-border">
                                <div className="relative flex items-center gap-4">
                                    <button
                                        onClick={startListening}
                                        disabled={!isConnected}
                                        className={`p-4 rounded-full transition-all mic-button ${
                                            isListening ? "recording" : ""
                                        } ${!isConnected ? "opacity-50 cursor-not-allowed" : ""}`}
                                    >
                                        <Mic className="w-6 h-6" />
                                    </button>
                                    <div className="flex-1 relative">
                                        <input
                                            type="text"
                                            value={intent}
                                            onChange={(e) => setIntent(e.target.value)}
                                            placeholder={isConnected ? "Enter your intent..." : "Please connect wallet first..."}
                                            disabled={!isConnected}
                                            className="w-full bg-black/80 p-8 outline-none pixel-corners text-lg text-[#fbd000] placeholder-[#fb7900] mario-border disabled:opacity-50"
                                        />
                                        {intent && (
                                            <button
                                                onClick={() => setIntent("")}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 hover:text-[#fbd000] transition-colors"
                                            >
                                                <X className="w-6 h-6" />
                                            </button>
                                        )}
                                    </div>
                                    <button
                                        onClick={handleFireIntent}
                                        disabled={!isConnected}
                                        className={`fire-button px-8 py-6 pixel-corners hover:brightness-110 transition-all text-lg uppercase tracking-wider flex items-center gap-3 ${
                                            !isConnected ? "opacity-50 cursor-not-allowed" : ""
                                        }`}
                                    >
                                        <Power className="w-5 h-5" />
                                        Fire!
                                    </button>
                                </div>
                            </div>

                            {/* Suggestion Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                {suggestions.map((suggestion, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setIntent(suggestion.text)}
                                        className="question-block bg-[#fbd000] p-8 pixel-corners question-block-border hover:scale-105 transition-transform"
                                    >
                                        <div className="flex items-center gap-4 mb-6">
                                            <div className="text-[#e52521]">{suggestion.icon}</div>
                                            <span className="text-lg text-[#e52521]">
                                                {suggestion.title}
                                            </span>
                                        </div>
                                        <p className="text-sm text-[#b52010]">{suggestion.text}</p>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Activity Feed */}
                        <div className="bg-[#e52521] p-8 pixel-corners mario-border">
                            <h2 className="text-lg mb-8 flex items-center gap-4 text-[#fbd000]">
                                <Coin className="w-6 h-6 animate-bounce" />
                                ACTIVITY LOG
                            </h2>
                            <div className="terminal-mario p-8 pixel-corners mario-border h-72 overflow-y-auto space-y-4">
                                {logs.map((log, index) => (
                                    <div
                                        key={index}
                                        className="text-sm flex gap-6 items-center coin-spin"
                                    >
                                        <span className="text-[#fbd000]">{log.time}</span>
                                        <Coin className="w-4 h-4 text-[#fbd000]" />
                                        <span className="text-white">{log.message}</span>
                                    </div>
                                ))}
                                {logs.length === 0 && (
                                    <div className="text-sm text-[#666]">No activity yet...</div>
                                )}
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        </>
    );
}

export default App;
