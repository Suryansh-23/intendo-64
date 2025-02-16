import { Address } from 'viem';

export const TOKEN_ADDRESSES: { [key: string]: Address } = {
    ETH: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", // WETH
    USDC: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    USDT: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    DAI: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
    WBTC: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
} as const;

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