import { describe, it } from 'mocha';
import { expect } from 'chai';
import { initialize } from '../src/analyzer';
import { ActionType, Protocol, InterestRateMode } from '../src/analyzer';

describe('IntentAnalyzer', () => {
    describe('transfer intents', () => {
        it('should correctly handle native ETH transfers', async () => {
            const analyzer = await initialize();
            const testCases = [
                {
                    input: "transfer 5 ETH to 0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
                    expected: {
                        actionType: ActionType.TRANSFER,
                        protocol: Protocol.GENERIC,
                        tokenAddress: "0x0000000000000000000000000000000000000000"
                    }
                },
                {
                    input: "send 2 ether to 0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
                    expected: {
                        actionType: ActionType.TRANSFER,
                        protocol: Protocol.GENERIC,
                        tokenAddress: "0x0000000000000000000000000000000000000000"
                    }
                },
                {
                    input: "transfer native eth to 0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
                    expected: {
                        actionType: ActionType.TRANSFER,
                        protocol: Protocol.GENERIC,
                        tokenAddress: "0x0000000000000000000000000000000000000000"
                    }
                }
            ];

            for (const testCase of testCases) {
                const result = await analyzer.analyzeMessage(testCase.input);
                expect(result.actionType).to.equal(testCase.expected.actionType);
                expect(result.protocol).to.equal(testCase.expected.protocol);
                expect(result.params.tokenIn).to.equal(testCase.expected.tokenAddress);
            }
        });

        it('should correctly handle ERC20 token transfers', async () => {
            const analyzer = await initialize();
            const testCases = [
                {
                    input: "transfer 100 USDC to 0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
                    expected: {
                        actionType: ActionType.TRANSFER,
                        protocol: Protocol.GENERIC,
                        tokenAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
                    }
                },
                {
                    input: "send 50 DAI to 0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
                    expected: {
                        actionType: ActionType.TRANSFER,
                        protocol: Protocol.GENERIC,
                        tokenAddress: "0x6B175474E89094C44Da98b954EedeAC495271d0F"
                    }
                }
            ];

            for (const testCase of testCases) {
                const result = await analyzer.analyzeMessage(testCase.input);
                expect(result.actionType).to.equal(testCase.expected.actionType);
                expect(result.protocol).to.equal(testCase.expected.protocol);
                expect(result.params.tokenIn).to.equal(testCase.expected.tokenAddress);
            }
        });
    });

    describe('swap intents', () => {
        it('should correctly parse Uniswap swap intents', async () => {
            const analyzer = await initialize();
            const testCases = [
                {
                    input: "swap 5 ETH for USDC on Uniswap with 0.5% slippage",
                    expected: {
                        actionType: ActionType.SWAP,
                        protocol: Protocol.UNISWAP,
                        params: {
                            tokenIn: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
                            tokenOut: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
                            slippage: 50
                        }
                    }
                },
                {
                    input: "exchange 10 ETH for USDT",
                    expected: {
                        actionType: ActionType.SWAP,
                        protocol: Protocol.UNISWAP,
                        params: {
                            tokenIn: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
                            tokenOut: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
                            slippage: 0
                        }
                    }
                },
                {
                    input: "convert 2 ETH to DAI",
                    expected: {
                        actionType: ActionType.SWAP,
                        protocol: Protocol.UNISWAP,
                        params: {
                            tokenIn: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
                            tokenOut: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
                            slippage: 0
                        }
                    }
                },
                {
                    input: "trade 1 ETH for WBTC",
                    expected: {
                        actionType: ActionType.SWAP,
                        protocol: Protocol.UNISWAP,
                        params: {
                            tokenIn: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
                            tokenOut: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
                            slippage: 0
                        }
                    }
                }
            ];

            for (const testCase of testCases) {
                const result = await analyzer.analyzeMessage(testCase.input);
                expect(result.actionType).to.equal(testCase.expected.actionType);
                expect(result.protocol).to.equal(testCase.expected.protocol);
                expect(result.params.tokenIn).to.equal(testCase.expected.params.tokenIn);
                expect(result.params.tokenOut).to.equal(testCase.expected.params.tokenOut);
                expect(result.params.slippage).to.equal(testCase.expected.params.slippage);
            }
        });
    });

    describe('Aave lending intents', () => {
        it('should correctly parse Aave borrow intents', async () => {
            const analyzer = await initialize();
            const testCases = [
                {
                    input: "borrow 1000 USDC from Aave with variable rate",
                    expected: {
                        actionType: ActionType.BORROW,
                        protocol: Protocol.AAVE,
                        params: {
                            tokenIn: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
                            rateMode: InterestRateMode.VARIABLE
                        }
                    }
                },
                {
                    input: "take a loan of 500 USDT on Aave",
                    expected: {
                        actionType: ActionType.BORROW,
                        protocol: Protocol.AAVE,
                        params: {
                            tokenIn: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
                            rateMode: InterestRateMode.VARIABLE
                        }
                    }
                },
                {
                    input: "borrow 100 DAI with stable rate",
                    expected: {
                        actionType: ActionType.BORROW,
                        protocol: Protocol.AAVE,
                        params: {
                            tokenIn: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
                            rateMode: InterestRateMode.STABLE
                        }
                    }
                }
            ];

            for (const testCase of testCases) {
                const result = await analyzer.analyzeMessage(testCase.input);
                expect(result.actionType).to.equal(testCase.expected.actionType);
                expect(result.protocol).to.equal(testCase.expected.protocol);
                expect(result.params.tokenIn).to.equal(testCase.expected.params.tokenIn);
                expect(result.params.rateMode).to.equal(testCase.expected.params.rateMode);
            }
        });

        it('should correctly parse Aave supply intents', async () => {
            const analyzer = await initialize();
            const testCases = [
                {
                    input: "deposit 2 ETH into Aave",
                    expected: {
                        actionType: ActionType.DEPOSIT,
                        protocol: Protocol.AAVE,
                        params: {
                            tokenIn: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
                            amount: "2"
                        }
                    }
                },
                {
                    input: "supply 1000 USDC to Aave",
                    expected: {
                        actionType: ActionType.DEPOSIT,
                        protocol: Protocol.AAVE,
                        params: {
                            tokenIn: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
                            amount: "1000"
                        }
                    }
                },
                {
                    input: "lend 5 ETH on Aave",
                    expected: {
                        actionType: ActionType.DEPOSIT,
                        protocol: Protocol.AAVE,
                        params: {
                            tokenIn: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
                            amount: "5"
                        }
                    }
                }
            ];

            for (const testCase of testCases) {
                const result = await analyzer.analyzeMessage(testCase.input);
                expect(result.actionType).to.equal(testCase.expected.actionType);
                expect(result.protocol).to.equal(testCase.expected.protocol);
                expect(result.params.tokenIn).to.equal(testCase.expected.params.tokenIn);
                expect(result.params.amount).to.equal(testCase.expected.params.amount);
            }
        });

        it('should correctly parse Aave withdraw intents', async () => {
            const analyzer = await initialize();
            const testCases = [
                {
                    input: "withdraw 500 USDC from Aave",
                    expected: {
                        actionType: ActionType.WITHDRAW,
                        protocol: Protocol.AAVE,
                        params: {
                            tokenIn: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
                            amount: "500"
                        }
                    }
                },
                {
                    input: "take out 200 USDT from Aave",
                    expected: {
                        actionType: ActionType.WITHDRAW,
                        protocol: Protocol.AAVE,
                        params: {
                            tokenIn: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
                            amount: "200"
                        }
                    }
                }
            ];

            for (const testCase of testCases) {
                const result = await analyzer.analyzeMessage(testCase.input);
                expect(result.actionType).to.equal(testCase.expected.actionType);
                expect(result.protocol).to.equal(testCase.expected.protocol);
                expect(result.params.tokenIn).to.equal(testCase.expected.params.tokenIn);
                expect(result.params.amount).to.equal(testCase.expected.params.amount);
            }
        });

        it('should correctly parse Aave repay intents', async () => {
            const analyzer = await initialize();
            const testCases = [
                {
                    input: "repay 500 USDC to Aave",
                    expected: {
                        actionType: ActionType.REPAY,
                        protocol: Protocol.AAVE,
                        params: {
                            tokenIn: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
                            amount: "500"
                        }
                    }
                },
                {
                    input: "pay back 1000 USDT on Aave",
                    expected: {
                        actionType: ActionType.REPAY,
                        protocol: Protocol.AAVE,
                        params: {
                            tokenIn: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
                            amount: "1000"
                        }
                    }
                },
                {
                    input: "settle 50 USDC debt",
                    expected: {
                        actionType: ActionType.REPAY,
                        protocol: Protocol.AAVE,
                        params: {
                            tokenIn: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
                            amount: "50"
                        }
                    }
                }
            ];

            for (const testCase of testCases) {
                const result = await analyzer.analyzeMessage(testCase.input);
                expect(result.actionType).to.equal(testCase.expected.actionType);
                expect(result.protocol).to.equal(testCase.expected.protocol);
                expect(result.params.tokenIn).to.equal(testCase.expected.params.tokenIn);
                expect(result.params.amount).to.equal(testCase.expected.params.amount);
            }
        });
    });
});