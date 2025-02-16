declare global {
    interface Window {
        webkitSpeechRecognition: any;
        SpeechRecognition: any;
    }
}

import {
    ArrowRightLeft,
    Coins as Coin,
    Mic,
    PiggyBank,
    Power,
    Send,
    X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Buffer } from 'buffer';
import { useAccount, useConnect, useChainId } from 'wagmi';
import { useWriteContract, useWatchContractEvent } from 'wagmi';
import { INTENDO_ABI, INTENDO_CONTRACT_ADDRESS } from './config/contract';

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

interface LogEntry {
    time: string;
    message: string;
    type: 'submit' | 'success' | 'error' | 'info';
}

function App() {
    const [intent, setIntent] = useState("");
    const [logs, setLogs] = useState<LogEntry[]>([]);
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
    const [isProcessing, setIsProcessing] = useState(false);

    const { writeContract, isPending: isExecuting } = useWriteContract();

    // Watch for ExecutionInitiated events
    useWatchContractEvent({
        address: INTENDO_CONTRACT_ADDRESS,
        abi: INTENDO_ABI,
        eventName: 'ExecutionInitiated',
        onLogs(logs) {
            const now = new Date();
            const time = now.toLocaleTimeString("en-US", {
                hour12: false,
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
            });

            logs.forEach(log => {
                setLogs((prev) => [
                    ...prev,
                    {
                        time,
                        message: `Intent submitted! Tx: ${log.transactionHash.slice(0, 6)}...${log.transactionHash.slice(-4)}`,
                        type: 'submit'
                    },
                ]);
            });
        },
    });

    const mapActionTypeToName = (actionType: number): string => {
        switch(actionType) {
            case 0: return "Swap";
            case 1: return "Add Liquidity";
            case 2: return "Remove Liquidity";
            case 3: return "Borrow";
            case 4: return "Repay";
            case 5: return "Deposit";
            case 6: return "Withdraw";
            case 7: return "Transfer";
            case 8: return "Approve";
            case 9: return "Check Balance";
            default: return "Unknown";
        }
    };

    const mapProtocolToName = (protocol: number): string => {
        switch(protocol) {
            case 0: return "Generic";
            case 1: return "Uniswap";
            case 2: return "Aave";
            default: return "Unknown";
        }
    };

    const getEventDescription = (actionType: number, protocol: number, success: boolean): string => {
        const actionName = mapActionTypeToName(actionType);
        const protocolName = mapProtocolToName(protocol);

        // Special handling for native ETH and token transfers
        if (protocol === 0 && actionType === 7) {
            return `${actionName} ${success ? "completed" : "failed"}`;
        }

        return `${actionName} on ${protocolName} ${success ? "completed" : "failed"}`;
    };

    const formatTransferLog = (message: string, address?: string): string => {
        // Check if the message contains a transfer event
        if (message.includes("Transfer")) {
            // For ETH transfers (zero address), show "ETH" instead of the address
            if (address === "0x0000000000000000000000000000000000000000") {
                return message.replace("Transfer", "ETH Transfer");
            }
            // For token transfers, keep the original format
            return message;
        }
        return message;
    };

    // Watch for IntentProcessed events
    useWatchContractEvent({
        address: INTENDO_CONTRACT_ADDRESS,
        abi: INTENDO_ABI,
        eventName: 'IntentProcessed',
        onLogs(logs) {
            const now = new Date();
            const time = now.toLocaleTimeString("en-US", {
                hour12: false,
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
            });

            logs.forEach(log => {
                const actionType = Number(log.args.actionType);
                const protocol = Number(log.args.protocol);
                const success = log.args.success ?? false;

                let message = `${getEventDescription(actionType, protocol, success)}! Tx: ${log.transactionHash.slice(0, 6)}...${log.transactionHash.slice(-4)}`;
                
                // Format transfer messages specially
                if (actionType === 7) {
                    message = formatTransferLog(message);
                }

                setLogs((prev) => [
                    ...prev,
                    {
                        time,
                        message,
                        type: success ? 'success' : 'error'
                    },
                ]);

                if (success) {
                    const audio = new Audio(
                        "https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3"
                    );
                    audio.volume = 0.2;
                    audio.play();
                }
            });
        },
    });

    // Watch for IntentFailed events
    useWatchContractEvent({
        address: INTENDO_CONTRACT_ADDRESS,
        abi: INTENDO_ABI,
        eventName: 'IntentFailed',
        onLogs(logs) {
            const now = new Date();
            const time = now.toLocaleTimeString("en-US", {
                hour12: false,
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
            });

            logs.forEach(log => {
                const actionType = Number(log.args.actionType);
                const protocol = Number(log.args.protocol);
                const reason = log.args.reason;

                const actionName = mapActionTypeToName(actionType);
                const protocolName = mapProtocolToName(protocol);

                setLogs((prev) => [
                    ...prev,
                    {
                        time,
                        message: `${actionName} on ${protocolName} failed: ${reason}`,
                        type: 'error'
                    },
                ]);

                const audio = new Audio(
                    "https://assets.mixkit.co/active_storage/sfx/1997/1997-preview.mp3"
                );
                audio.volume = 0.2;
                audio.play();
            });
        },
    });

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
        // Check if the browser supports speech recognition
        if (!("SpeechRecognition" in window) && !("webkitSpeechRecognition" in window)) {
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
                    message: "Error: Speech recognition is not supported in this browser. Please use Chrome.",
                    type: 'error'
                },
            ]);
            return;
        }

        try {
            const SpeechRecognitionAPI =
                window.SpeechRecognition || window.webkitSpeechRecognition;
            
            // Clean up any existing instance
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }

            recognitionRef.current = new SpeechRecognitionAPI();
            
            // Configure recognition settings
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = false;
            recognitionRef.current.lang = 'en-US';

            recognitionRef.current.onstart = () => {
                setIsListening(true);
            };

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

            recognitionRef.current.onerror = (event: any) => {
                console.log(`Speech recognition error: ${event.error}`);
                setIsListening(false);
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
            };

            recognitionRef.current.start();
        } catch (error) {
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
                    message: `Failed to start speech recognition: ${error instanceof Error ? error.message : 'Unknown error'}`,
                    type: 'error'
                },
            ]);
            setIsListening(false);
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
                    type: 'error'
                },
            ]);
            return;
        }

        try {
            // Convert the intent string to bytes
            const inputBytes = new TextEncoder().encode(intent);
            writeContract({
                address: INTENDO_CONTRACT_ADDRESS,
                abi: INTENDO_ABI,
                functionName: 'runExecution',
                args: [`0x${Buffer.from(inputBytes).toString('hex')}`],
            });

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
                    message: `Processing intent: ${intent}`,
                    type: 'info'
                },
            ]);
        } catch (error) {
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
                    message: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
                    type: 'error'
                },
            ]);
        }
    };

    const handleSuggestionClick = (text: string) => {
        setIsProcessing(true);
        setIntent(text);
        // Add small delay to show processing animation
        setTimeout(() => setIsProcessing(false), 500);
    };

    const suggestions = [
        {
            title: "Swap (Uniswap)",
            icon: <ArrowRightLeft className="w-6 h-6" />,
            text: "swap 5 ETH for USDC on Uniswap with 0.5% slippage",
            variations: [
                "exchange 10 ETH for USDT",
                "convert 2 ETH to DAI",
                "trade 1 ETH for WBTC"
            ]
        },
        {
            title: "Borrow (Aave)",
            icon: <PiggyBank className="w-6 h-6" />,
            text: "borrow 1000 USDC from Aave with variable rate",
            variations: [
                "take a loan of 500 USDT on Aave",
                "borrow 100 DAI with stable rate",
                "lend me 50 USDC from Aave"
            ]
        },
        {
            title: "Supply (Aave)",
            icon: <Send className="w-6 h-6 rotate-90" />,
            text: "deposit 2 ETH into Aave",
            variations: [
                "supply 1000 USDC to Aave",
                "provide 500 DAI to lending pool",
                "lend 5 ETH on Aave"
            ]
        },
        {
            title: "Transfer",
            icon: <Send className="w-6 h-6" />,
            text: "transfer 1 ETH to 0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
            variations: [
                "send 100 USDC to 0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
                "give 50 DAI to 0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
                "transfer 0.5 ETH to 0x742d35Cc6634C0532925a3b844Bc454e4438f44e"
            ]
        },
        {
            title: "Withdraw (Aave)",
            icon: <Send className="w-6 h-6 -rotate-45" />,
            text: "withdraw 500 USDC from Aave",
            variations: [
                "take out 200 USDT from Aave",
                "remove 100 DAI from lending pool",
                "get 1 ETH from Aave"
            ]
        },
        {
            title: "Repay (Aave)",
            icon: <Send className="w-6 h-6 -rotate-90" />,
            text: "repay 500 USDC to Aave",
            variations: [
                "pay back 1000 USDT on Aave",
                "return 100 DAI loan",
                "settle 50 USDC debt"
            ]
        }
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
                    <header className="p-8 flex justify-between items-center border-b-[6px] border-[#e52521] bg-gradient-to-b from-[#1a0f2e]/95 to-[#1a0f2e]/85 backdrop-blur-sm relative z-10 shadow-lg">
                        <div className="flex items-center gap-6">
                            <img src="/icon.png" alt="Icon" className="w-12 h-12" />
                            <h1 className="text-4xl text-[#fbd000] drop-shadow-[2px_2px_0_#e52521] font-bold">
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
                                        disabled={!isConnected || isExecuting}
                                        className={`fire-button px-8 py-6 pixel-corners hover:brightness-110 transition-all text-lg uppercase tracking-wider flex items-center gap-3 ${
                                            !isConnected || isExecuting ? "opacity-50 cursor-not-allowed" : ""
                                        }`}
                                    >
                                        <Power className="w-5 h-5" />
                                        {isExecuting ? "Firing..." : "Fire!"}
                                    </button>
                                </div>
                            </div>

                            {/* Suggestion Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {suggestions.map((suggestion, index) => (
                                    <div key={index} className="group relative">
                                        <button
                                            onClick={() => handleSuggestionClick(suggestion.text)}
                                            className={`w-full question-block bg-[#fbd000] p-8 pixel-corners question-block-border hover:scale-105 transition-transform ${
                                                isProcessing ? 'animate-pulse' : ''
                                            }`}
                                        >
                                            <div className="flex items-center gap-4 mb-6">
                                                <div className="text-[#e52521]">{suggestion.icon}</div>
                                                <span className="text-lg text-[#e52521]">
                                                    {suggestion.title}
                                                </span>
                                            </div>
                                            <p className="text-md text-[#b52010]">{suggestion.text}</p>
                                        </button>
                                        {/* Tooltip with variations */}
                                        <div className="absolute left-0 w-full p-4 bg-black/90 rounded-lg invisible group-hover:visible transition-all duration-200 z-20 mt-2 pixel-corners">
                                            <p className="text-[#fbd000] text-xs mb-2">Try saying:</p>
                                            {suggestion.variations.map((variation, i) => (
                                                <p 
                                                    key={i} 
                                                    className="text-white/80 text-sm cursor-pointer hover:text-[#fbd000] transition-colors mb-1"
                                                    onClick={() => handleSuggestionClick(variation)}
                                                >
                                                    "{variation}"
                                                </p>
                                            ))}
                                        </div>
                                    </div>
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
                                {logs
                                    .filter(log => !log.message.includes('Speech recognition') && 
                                                 !log.message.includes('Listening...') && 
                                                 !log.message.includes('No speech was detected'))
                                    .map((log, index) => (
                                    <div
                                        key={index}
                                        className="text-sm flex gap-6 items-center coin-spin"
                                    >
                                        <span className="text-[#fbd000]">{log.time}</span>
                                        <Coin className={`w-4 h-4 ${
                                            log.type === 'success' ? 'text-green-400' :
                                            log.type === 'error' ? 'text-red-400' :
                                            log.type === 'submit' ? 'text-blue-400' :
                                            'text-[#fbd000]'
                                        }`} />
                                        <span className={`${
                                            log.type === 'success' ? 'text-green-400' :
                                            log.type === 'error' ? 'text-red-400' :
                                            log.type === 'submit' ? 'text-blue-400' :
                                            'text-white'
                                        }`}>{log.message}</span>
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
