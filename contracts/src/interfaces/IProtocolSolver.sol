// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IProtocolSolver {
    function executeSwap(
        address tokenIn,
        address tokenOut,
        uint256 amount,
        address recipient,
        uint16 slippage
    ) external returns (bool);

    function executeBorrow(
        address asset,
        uint256 amount,
        address recipient,
        uint8 rateMode
    ) external returns (bool);

    function executeRepay(
        address asset,
        uint256 amount,
        uint8 rateMode
    ) external returns (bool);

    function executeDeposit(
        address asset,
        uint256 amount
    ) external returns (bool);

    function executeWithdraw(
        address asset,
        uint256 amount,
        address recipient
    ) external returns (bool);
}
