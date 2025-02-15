// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "../interfaces/IProtocolSolver.sol";

contract UniswapSolver is IProtocolSolver {
    event SwapExecuted(
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountIn,
        uint256 amountOut,
        address indexed recipient
    );

    function executeSwap(
        address tokenIn,
        address tokenOut,
        uint256 amount,
        address recipient,
        uint16
    ) external override returns (bool) {
        // Mock implementation
        emit SwapExecuted(
            tokenIn,
            tokenOut,
            amount,
            (amount * 99) / 100,
            recipient
        );
        return true;
    }

    function executeBorrow(
        address,
        uint256,
        address,
        uint8
    ) external pure override returns (bool) {
        revert("Not supported");
    }

    function executeRepay(
        address,
        uint256,
        uint8
    ) external pure override returns (bool) {
        revert("Not supported");
    }

    function executeDeposit(
        address,
        uint256
    ) external pure override returns (bool) {
        revert("Not supported");
    }

    function executeWithdraw(
        address,
        uint256,
        address
    ) external pure override returns (bool) {
        revert("Not supported");
    }
}
