import { encodeAbiParameters, getAddress, Hex, isAddress, parseUnits } from "viem";
import { ActionType, DeFiAction, Protocol } from "./analyzer";

// Match Solidity struct exactly
const INTENT_ABI = [
    { name: "actionType", type: "uint8" },
    { name: "protocol", type: "uint8" },
    {
        name: "params",
        type: "tuple",
        components: [
            { name: "tokenIn", type: "address" },
            { name: "tokenOut", type: "address" },
            { name: "amount", type: "uint256" },
            { name: "recipient", type: "address" },
            { name: "rateMode", type: "uint8" },
            { name: "slippage", type: "uint16" },
            { name: "poolId", type: "address" },
        ],
    },
] as const;

export class ActionEncoder {
    private validateAddress(address: string): `0x${string}` {
        // Skip validation for zero address
        if (address === "0x0000000000000000000000000000000000000000") {
            return address as `0x${string}`;
        }

        if (!isAddress(address)) {
            throw new Error(`Invalid address: ${address}`);
        }
        return getAddress(address) as `0x${string}`; // Checksum address
    }

    private validateAmount(amount: string): bigint {
        try {
            // Special handling for ETH amounts
            const amountStr = amount.toString();
            if (amountStr.includes('.')) {
                return parseUnits(amountStr, 18);
            } else {
                return parseUnits(amountStr, 18);
            }
        } catch (e) {
            console.error("Amount validation error:", e);
            throw new Error(`Invalid amount: ${amount}`);
        }
    }

    private validateSlippage(slippage: number): number {
        if (slippage < 0 || slippage > 10000) {
            throw new Error(`Invalid slippage: ${slippage}`);
        }
        return slippage;
    }

    public encodeAction(action: DeFiAction): Hex {
        try {
            // Protocol-specific token handling and validation
            if (action.protocol === Protocol.GENERIC && action.actionType === ActionType.TRANSFER) {
                // Validate transfer requirements
                if (!action.params.recipient || action.params.recipient === "0x0000000000000000000000000000000000000000") {
                    throw new Error("Transfer requires a valid recipient address");
                }
                if (!action.params.amount || action.params.amount === "0") {
                    throw new Error("Transfer requires a valid amount");
                }
            }

            // Validate and format parameters
            const params = {
                tokenIn: this.validateAddress(action.params.tokenIn),
                tokenOut: this.validateAddress(action.params.tokenOut),
                amount: this.validateAmount(action.params.amount),
                recipient: this.validateAddress(action.params.recipient || "0x0000000000000000000000000000000000000000"),
                rateMode: action.params.rateMode,
                slippage: this.validateSlippage(action.params.slippage),
                poolId: this.validateAddress(action.params.poolId || "0x0000000000000000000000000000000000000000"),
            };

            // Add debug logging
            console.log("Encoding action:", {
                actionType: ActionType[action.actionType],
                protocol: Protocol[action.protocol],
                params: {
                    ...params,
                    amount: params.amount.toString()
                }
            });

            const abiValue: [number, number, typeof params] = [
                action.actionType,
                action.protocol,
                params,
            ];

            return encodeAbiParameters(INTENT_ABI, abiValue);
        } catch (error) {
            console.error("Encoding error:", error);
            const errorMessage =
                error instanceof Error ? error.message : String(error);
            throw new Error(`Failed to encode action: ${errorMessage}`);
        }
    }
}

export const createEncoder = (): ActionEncoder => {
    return new ActionEncoder();
};

