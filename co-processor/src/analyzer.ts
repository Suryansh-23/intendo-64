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

        // Reduce transfer training to avoid confusion
        this.classifier.addDocument("transfer to address", "transfer");
        this.classifier.addDocument("send to wallet", "transfer");

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

    private extractTokens(text: string): {
        token_in?: string | undefined;
        token_out?: string | undefined;
    } {
        const tokens = {
            token_in: undefined as string | undefined,
            token_out: undefined as string | undefined,
        };

        // Match both token tickers and addresses
        const tokenRegex = /(ETH|USDC|USDT|DAI|WBTC|0x[a-fA-F0-9]{40})/gi;
        const matches = text.match(tokenRegex) || [];

        // For lending operations, we typically only need token_in
        const action = this.classifier.classify(text);
        if (["borrow", "repay", "deposit", "withdraw"].includes(action)) {
            tokens.token_in = matches[0]?.toUpperCase();
            return tokens;
        }

        // For swaps and other operations, handle both tokens
        if (matches.length >= 2) {
            tokens.token_in = matches[0]?.toUpperCase();
            tokens.token_out = matches[1]?.toUpperCase();
        } else if (matches.length === 1) {
            tokens.token_in = matches[0].toUpperCase();
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
        const action = this.classifier.classify(text);

        // If it's a lending action, default to Aave
        if (["borrow", "repay", "deposit"].includes(action)) {
            return "aave";
        }

        if (
            normalizedText.includes("uniswap") ||
            (action === "swap" && !normalizedText.includes("aave"))
        ) {
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

        // More precise pattern matching for swaps
        const swapPatterns = [
            /\bswap\b/i,
            /\bexchange\b/i,
            /\bconvert\b/i,
            /\btrade\b/i,
            /\b\w+\s+for\s+\w+\b/i, // matches "ETH for USDC" pattern
        ];

        // Check for swap patterns first
        if (swapPatterns.some((pattern) => pattern.test(normalizedText))) {
            return "swap";
        }

        // Check for transfer patterns
        const transferPatterns = [
            /\btransfer\s+to\b/i,
            /\bsend\s+to\b/i,
            /\bgive\s+to\b/i,
        ];

        if (transferPatterns.some((pattern) => pattern.test(normalizedText))) {
            return "transfer";
        }

        // Use classifier as fallback
        return this.classifier.classify(normalizedText);
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
        return actionMap[action] || ActionType.TRANSFER;
    }

    private convertToProtocol(protocol: string): Protocol {
        const protocolMap: { [key: string]: Protocol } = {
            uniswap: Protocol.UNISWAP,
            aave: Protocol.AAVE,
            generic: Protocol.GENERIC,
        };
        return protocolMap[protocol] || Protocol.GENERIC;
    }

    async analyzeMessage(userInput: string): Promise<DeFiAction> {
        const tokens = this.extractTokens(userInput);
        const amount = this.extractAmount(userInput);
        const slippage = this.extractSlippage(userInput);
        const protocol = this.determineProtocol(userInput);
        const action = this.determineAction(userInput);

        // Debug logging
        console.log("Determined action:", action);
        console.log("Action type:", this.convertToActionType(action));

        const interest_rate_mode =
            protocol === "aave"
                ? this.extractInterestRateMode(userInput)
                : undefined;
        const recipient = this.extractRecipient(userInput);

        return {
            actionType: this.convertToActionType(action),
            protocol: this.convertToProtocol(protocol),
            params: {
                tokenIn: this.resolveTokenAddress(tokens.token_in),
                tokenOut: this.resolveTokenAddress(tokens.token_out),
                amount: amount || "0",
                recipient: this.normalizeAddress(recipient),
                rateMode:
                    interest_rate_mode === "stable"
                        ? InterestRateMode.STABLE
                        : interest_rate_mode === "variable"
                        ? InterestRateMode.VARIABLE
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

