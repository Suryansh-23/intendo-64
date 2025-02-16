import React, { useState, useRef, useEffect } from "react";
import {
    Wallet,
    ArrowRightLeft,
    Send,
    Grid as Bridge,
    PiggyBank,
    RotateCcw,
    X,
    Power,
    Coins as Coin,
    Mic,
} from "lucide-react";

function LoadingScreen({
    progress,
    message,
}: {
    progress: number;
    message: string;
}) {
    return (
        <div className="fixed inset-0 bg-[#1a0f2e] flex flex-col items-center justify-center z-50 transition-opacity duration-500">
            <div className="w-64 h-64 relative mb-8">
                <img src="/icon.png" alt="Icon" className="w-full h-full" />
            </div>
            <div className="w-80 h-8 bg-black/50 pixel-corners overflow-hidden mb-4">
                <div
                    className="h-full bg-[#fbd000] transition-all duration-300 progress-bar"
                    style={{ width: `${progress}%` }}
                />
            </div>
            <p className="text-[#fbd000] text-lg mb-2">{progress}%</p>
            <p className="text-white/80 text-sm">{message}</p>
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
    const recognitionRef = useRef<SpeechRecognition | null>(null);

    useEffect(() => {
        const loadingMessages = [
            "Connecting to blockchain...",
            "Initializing smart contracts...",
            "Syncing with metaverse...",
            "Loading pixel assets...",
            "Preparing your adventure...",
        ];

        let currentProgress = 0;
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
                    Math.floor((currentProgress / 100) * loadingMessages.length)
                ]
            );

            // Play retro beep sound at certain intervals
            if (currentProgress % 20 === 0) {
                const audio = new Audio(
                    "https://assets.mixkit.co/active_storage/sfx/2001/2001-preview.mp3"
                );
                audio.volume = 0.1;
                audio.play();
            }
        }, 300);

        return () => clearInterval(interval);
    }, []);

    const startListening = () => {
        if (
            "SpeechRecognition" in window ||
            "webkitSpeechRecognition" in window
        ) {
            const SpeechRecognition =
                window.SpeechRecognition || window.webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();

            recognitionRef.current.onresult = (event) => {
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
                <LoadingScreen progress={progress} message={loadingMessage} />
            )}

            <div className="min-h-screen mario-gradient text-white font-sans relative overflow-hidden">
                <div className="absolute inset-0 parallax-background"></div>
                <div className="ground-background"></div>
                <div className="scanline"></div>

                {/* Floating Platforms */}
                <div
                    className="platform"
                    style={{ left: "10%", top: "20%" }}></div>
                <div
                    className="platform"
                    style={{ left: "30%", top: "40%" }}></div>
                <div
                    className="platform"
                    style={{ left: "60%", top: "30%" }}></div>
                <div
                    className="platform"
                    style={{ left: "80%", top: "50%" }}></div>

                {/* Floating Clouds */}
                <div
                    className="cloud"
                    style={{
                        top: "15%",
                        animationDelay: "0s",
                        opacity: "0.4",
                        filter: "blur(1px)",
                    }}></div>
                <div
                    className="cloud"
                    style={{
                        top: "35%",
                        animationDelay: "-15s",
                        opacity: "0.3",
                        filter: "blur(2px)",
                    }}></div>
                <div
                    className="cloud"
                    style={{
                        top: "25%",
                        animationDelay: "-7s",
                        opacity: "0.2",
                        filter: "blur(3px)",
                    }}></div>

                {/* Header */}
                <header className="p-8 flex justify-between items-center border-b-[6px] border-[#e52521] relative z-10">
                    <div className="flex items-center gap-6">
                        <img src="/icon.png" alt="Icon" className="w-12 h-12" />
                        <h1 className="text-2xl text-[#fbd000] drop-shadow-[2px_2px_0_#e52521]">
                            INTENDO-64
                        </h1>
                    </div>

                    <div className="flex items-center gap-8 bg-[#e52521] p-6 pixel-corners mario-border">
                        <div className="flex items-center gap-4">
                            <div className="w-4 h-4 bg-[#fbd000] rounded-full shadow-[0_0_12px_rgba(251,208,0,0.5)]"></div>
                            <span className="text-sm text-white">
                                Polygon Mumbai
                            </span>
                        </div>
                        <div className="flex items-center gap-4 border-l-2 border-[#b52010] pl-8">
                            <Wallet className="w-5 h-5 text-[#fbd000]" />
                            <span className="text-sm text-white">
                                0x89...8C33
                            </span>
                        </div>
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
                                    className={`p-4 rounded-full transition-all mic-button ${
                                        isListening ? "recording" : ""
                                    }`}>
                                    <Mic className="w-6 h-6" />
                                </button>
                                <div className="flex-1 relative">
                                    <input
                                        type="text"
                                        value={intent}
                                        onChange={(e) =>
                                            setIntent(e.target.value)
                                        }
                                        placeholder="Enter your intent..."
                                        className="w-full bg-black/80 p-8 outline-none pixel-corners text-lg text-[#fbd000] placeholder-[#fb7900] mario-border"
                                    />
                                    {intent && (
                                        <button
                                            onClick={() => setIntent("")}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 hover:text-[#fbd000] transition-colors">
                                            <X className="w-6 h-6" />
                                        </button>
                                    )}
                                </div>
                                <button
                                    onClick={handleFireIntent}
                                    className="fire-button px-8 py-6 pixel-corners hover:brightness-110 transition-all text-lg uppercase tracking-wider flex items-center gap-3">
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
                                    className="question-block bg-[#fbd000] p-8 pixel-corners question-block-border hover:scale-105 transition-transform">
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="text-[#e52521]">
                                            {suggestion.icon}
                                        </div>
                                        <span className="text-lg text-[#e52521]">
                                            {suggestion.title}
                                        </span>
                                    </div>
                                    <p className="text-sm text-[#b52010]">
                                        {suggestion.text}
                                    </p>
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
                                    className="text-sm flex gap-6 items-center coin-spin">
                                    <span className="text-[#fbd000]">
                                        {log.time}
                                    </span>
                                    <Coin className="w-4 h-4 text-[#fbd000]" />
                                    <span className="text-white">
                                        {log.message}
                                    </span>
                                </div>
                            ))}
                            {logs.length === 0 && (
                                <div className="text-sm text-[#666]">
                                    No activity yet...
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </>
    );
}

export default App;

