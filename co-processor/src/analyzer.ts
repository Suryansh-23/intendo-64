import natural from "natural";
import nlp from "compromise";

// Token address mapping for common tokens
const TOKEN_ADDRESSES: { [key: string]: string } = {
    ETH: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", // WETH
    USDC: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    USDT: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    DAI: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
    WBTC: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
};

// Smart contract compatible enums
export enum ActionType {
    SWAP = 0,
    ADD_LIQUIDITY = 1,
    REMOVE_LIQUIDITY = 2,
    BORROW = 3,
    REPAY = 4,
    DEPOSIT = 5,
    WITHDRAW = 6,
    TRANSFER = 7,
    APPROVE = 8,
    CHECK_BALANCE = 9,
}

export enum Protocol {
    GENERIC = 0,
    UNISWAP = 1,
    AAVE = 2,
}

export enum InterestRateMode {
    NONE = 0,
    STABLE = 1,
    VARIABLE = 2,
}

// ABI-friendly parameter structure
interface ActionParameters {
    tokenIn: string; // hex address
    tokenOut: string; // hex address
    amount: string; // decimal string (will be converted to wei)
    recipient: string; // hex address
    rateMode: InterestRateMode;
    slippage: number; // basis points (e.g., 50 = 0.5%)
    poolId: string; // hex identifier
}

export interface DeFiAction {
    actionType: ActionType;
    protocol: Protocol;
    params: ActionParameters;
}

class IntentAnalyzer {
    private classifier: natural.BayesClassifier;

    constructor() {
        this.classifier = new natural.BayesClassifier();
        this.trainClassifier();
    }

    private trainClassifier() {
        // Swap related training - add more weight by repeating
        this.classifier.addDocument("swap eth for usdc", "swap");
        this.classifier.addDocument("swap tokens", "swap");
        this.classifier.addDocument("exchange tokens", "swap");
        this.classifier.addDocument("convert tokens", "swap");
        this.classifier.addDocument("eth for usdc", "swap");
        this.classifier.addDocument("token for token", "swap");
        this.classifier.addDocument("exchange eth usdc", "swap");
        this.classifier.addDocument("convert eth to usdc", "swap");
        this.classifier.addDocument("trade eth for usdc", "swap");

        // Transfer-specific training with both ETH and token variations
        this.classifier.addDocument("transfer eth to address", "transfer");
        this.classifier.addDocument("send native eth to wallet", "transfer");
        this.classifier.addDocument("give ether to address", "transfer");
        this.classifier.addDocument("transfer tokens to 0x", "transfer");
        this.classifier.addDocument("send usdc to wallet", "transfer");
        this.classifier.addDocument("transfer 5 eth", "transfer");
        this.classifier.addDocument("send 100 usdc", "transfer");
        this.classifier.addDocument("give 10 eth", "transfer");
        this.classifier.addDocument("transfer ether", "transfer");
        this.classifier.addDocument("move eth", "transfer");

        // Other actions
        this.classifier.addDocument(
            "add provide supply liquidity pool",
            "add_liquidity"
        );
        this.classifier.addDocument("withdraw remove take out get", "withdraw");
        this.classifier.addDocument("approve allow permit", "approve");
        this.classifier.addDocument("check balance view show", "check_balance");
        this.classifier.addDocument("borrow loan take lending lend", "borrow");
        this.classifier.addDocument("repay return pay back settle", "repay");
        this.classifier.addDocument("deposit supply provide lend", "deposit");
        this.classifier.train();
    }

    private resolveTokenAddress(token: string | undefined): string {
        if (!token) return "0x0000000000000000000000000000000000000000";

        // Special case for ETH in transfers (use zero address)
        if (token.toUpperCase() === "ETH") {
            const action = this.lastDeterminedAction;
            if (action === "transfer") {
                return "0x0000000000000000000000000000000000000000";
            }
            // For other actions (like swaps), use WETH
            return TOKEN_ADDRESSES["ETH"] || "0x0000000000000000000000000000000000000000";
        }

        // If it's already an address, return it normalized
        if (token.startsWith("0x") && token.length === 42) {
            return token.toLowerCase();
        }

        // Look up token ticker in our mapping
        const upperToken = token.toUpperCase();
        return (
            TOKEN_ADDRESSES[upperToken] ||
            "0x0000000000000000000000000000000000000000"
        );
    }

    private lastDeterminedAction: string = "";

    private extractTokens(text: string): {
        token_in?: string | undefined;
        token_out?: string | undefined;
    } {
        const tokens = {
            token_in: undefined as string | undefined,
            token_out: undefined as string | undefined,
        };

        // Enhanced token pattern matching for input/output tokens
        const tokenRegex = /(ETH(?:ER)?|NATIVE\s+ETH|USDC|USDT|DAI|WBTC|0x[a-fA-F0-9]{40})/gi;
        const matches = text.match(tokenRegex) || [];

        if (matches.length > 0) {
            // First token is always input token
            const firstToken = matches[0]?.toUpperCase();
            tokens.token_in = firstToken?.includes('ETH') ? 'ETH' : firstToken;

            // For swap operations, look for output token after "for", "to", or "into"
            if (matches.length > 1 && /(?:for|to|into)\s+\w+/i.test(text)) {
                const secondToken = matches[1]?.toUpperCase();
                tokens.token_out = secondToken?.includes('ETH') ? 'ETH' : secondToken;
            }
        }

        return tokens;
    }

    private extractAmount(text: string): string | undefined {
        const doc = nlp(text);
        const numbers = doc.numbers().toNumber().out("array");
        return numbers.length > 0 ? numbers[0].toString() : undefined;
    }

    private extractSlippage(text: string): number | undefined {
        const slippageMatch = text.match(/(\d*\.?\d+)%?\s*slippage/);
        return slippageMatch?.[1]
            ? parseFloat(slippageMatch[1]) / 100
            : undefined;
    }

    private extractInterestRateMode(
        text: string
    ): "stable" | "variable" | undefined {
        const normalizedText = text.toLowerCase();
        if (normalizedText.includes("stable")) return "stable";
        if (normalizedText.includes("variable")) return "variable";
        return "variable"; // Default to variable if not specified
    }

    private determineProtocol(text: string): "uniswap" | "aave" | "generic" {
        const normalizedText = text.toLowerCase();
        const action = this.determineAction(text);

        // If it's a transfer action, always use generic protocol
        if (action === "transfer") {
            return "generic";
        }

        // If it's a lending action, default to Aave
        if (["borrow", "repay", "deposit"].includes(action)) {
            return "aave";
        }

        if (normalizedText.includes("uniswap") || action === "swap") {
            return "uniswap";
        }

        if (normalizedText.includes("aave")) {
            return "aave";
        }

        return "generic";
    }

    private extractRecipient(text: string): string | undefined {
        // Match Ethereum addresses (0x followed by 40 hex characters)
        const addressMatch = text.match(/0x[a-fA-F0-9]{40}/);
        return addressMatch ? addressMatch[0] : undefined;
    }

    private determineAction(text: string): string {
        const normalizedText = text.toLowerCase();

        // Enhanced patterns for deposit/supply actions
        const supplyPatterns = [
            /\bdeposit\b/i,
            /\bsupply\b/i,
            /\bprovide\b/i,
            /\blend\s+\d+/i  // Only match "lend" when followed by amount
        ];

        if (supplyPatterns.some(pattern => pattern.test(normalizedText))) {
            this.lastDeterminedAction = "deposit";
            return "deposit";
        }

        // Enhanced patterns for withdraw actions
        const withdrawPatterns = [
            /\bwithdraw\b/i,
            /\btake\s+out\b/i,
            /\bremove\s+from\b/i,
            /\bget\s+.*\s+from\b/i
        ];

        if (withdrawPatterns.some(pattern => pattern.test(normalizedText))) {
            this.lastDeterminedAction = "withdraw";
            return "withdraw";
        }

        // Enhanced transfer patterns
        const transferPatterns = [
            /\b(?:transfer|send|give)\s+(?:\d*\.?\d+)?\s*(?:eth(?:er)?|native\s+eth|usdc|usdt|dai|wbtc)\s+(?:to\s+)?(?:0x[a-fA-F0-9]{40})/i,
            /\b(?:move|forward)\s+(?:\d*\.?\d+)?\s*(?:eth(?:er)?|native\s+eth|usdc|usdt|dai|wbtc)\s+(?:to\s+)?(?:0x[a-fA-F0-9]{40})/i,
            /\b(?:transfer|send|give)\s+(?:to\s+)?(?:0x[a-fA-F0-9]{40})\s+(?:\d*\.?\d+)?\s*(?:eth(?:er)?|native\s+eth|usdc|usdt|dai|wbtc)/i
        ];

        if (transferPatterns.some((pattern) => pattern.test(normalizedText))) {
            this.lastDeterminedAction = "transfer";
            return "transfer";
        }

        // Check for swap patterns
        const swapPatterns = [
            /\bswap\b/i,
            /\bexchange\b/i,
            /\bconvert\b/i,
            /\btrade\b/i,
            /\b\w+\s+for\s+\w+\b/i,
        ];

        if (swapPatterns.some((pattern) => pattern.test(normalizedText))) {
            this.lastDeterminedAction = "swap";
            return "swap";
        }

        // Use classifier as fallback
        const result = this.classifier.classify(normalizedText);
        this.lastDeterminedAction = result;
        return result;
    }

    // Validation helpers
    private isValidAddress(address: string): boolean {
        return /^0x[a-fA-F0-9]{40}$/.test(address);
    }

    private normalizeAddress(address: string | undefined): string {
        return (
            address?.toLowerCase() ||
            "0x0000000000000000000000000000000000000000"
        );
    }

    private convertToActionType(action: string): ActionType {
        // Debug logging
        console.log("Converting action type from:", action);

        const actionMap: { [key: string]: ActionType } = {
            swap: ActionType.SWAP,
            add_liquidity: ActionType.ADD_LIQUIDITY,
            remove_liquidity: ActionType.REMOVE_LIQUIDITY,
            borrow: ActionType.BORROW,
            repay: ActionType.REPAY,
            deposit: ActionType.DEPOSIT,
            withdraw: ActionType.WITHDRAW,
            transfer: ActionType.TRANSFER,
            approve: ActionType.APPROVE,
            check_balance: ActionType.CHECK_BALANCE,
        };

        const actionType = actionMap[action];
        if (actionType === undefined) {
            console.warn(`Unknown action type: ${action}, defaulting to last known action`);
            // If action is unknown, use the last determined action as fallback
            return actionMap[this.lastDeterminedAction] || ActionType.TRANSFER;
        }
        return actionType;
    }

    private convertToProtocol(protocol: string): Protocol {
        switch (protocol.toLowerCase()) {
            case "uniswap":
                return Protocol.UNISWAP;
            case "aave":
                return Protocol.AAVE;
            default:
                return Protocol.GENERIC;
        }
    }

    async analyzeMessage(userInput: string): Promise<DeFiAction> {
        const tokens = this.extractTokens(userInput);
        const amount = this.extractAmount(userInput);
        const slippage = this.extractSlippage(userInput);
        const protocol = this.determineProtocol(userInput);
        const action = this.determineAction(userInput);

        // Debug logging
        console.log("Raw user input:", userInput);
        console.log("Determined action:", action);
        const actionType = this.convertToActionType(action);
        console.log("Converted action type:", ActionType[actionType]);

        return {
            actionType,
            protocol: this.convertToProtocol(protocol),
            params: {
                tokenIn: this.resolveTokenAddress(tokens.token_in),
                tokenOut: this.resolveTokenAddress(tokens.token_out),
                amount: amount || "0",
                recipient: this.normalizeAddress(tokens.token_out ? undefined : this.extractRecipient(userInput)),
                rateMode: protocol === "aave" 
                    ? (this.extractInterestRateMode(userInput) === "stable" 
                        ? InterestRateMode.STABLE 
                        : InterestRateMode.VARIABLE)
                    : InterestRateMode.NONE,
                slippage: (slippage || 0) * 10000, // Convert to basis points
                poolId: "0x0000000000000000000000000000000000000000",
            },
        };
    }
}

async function initialize() {
    return new IntentAnalyzer();
}

export { initialize, IntentAnalyzer };

