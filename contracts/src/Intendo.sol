// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "../lib/coprocessor-base-contract/src/CoprocessorAdapter.sol";
import "./interfaces/IProtocolSolver.sol";

contract Intendo is CoprocessorAdapter {
    struct Params {
        address tokenIn;
        address tokenOut;
        uint256 amount;
        address recipient;
        uint8 rateMode;
        uint16 slippage;
        address poolId;
    }

    struct Action {
        uint8 actionType;
        uint8 protocol;
        Params params;
    }

    struct ProcessedAction {
        uint8 actionType;
        uint8 protocol;
        bool success;
        uint256 timestamp;
        Params params;
    }

    Action[] actions;
    ProcessedAction[] private processedActions;

    event ExecutionInitiated(bytes input);

    event IntentProcessed(
        uint8 indexed actionType,
        uint8 indexed protocol,
        bool success
    );

    event IntentFailed(
        uint8 indexed actionType,
        uint8 indexed protocol,
        string reason
    );

    event TransferExecuted(
        address indexed token,
        address indexed from,
        address indexed to,
        uint256 amount
    );

    IProtocolSolver public immutable uniswapSolver;
    IProtocolSolver public immutable aaveSolver;

    constructor(
        address _taskIssuerAddress,
        bytes32 _machineHash,
        address _uniswapSolver,
        address _aaveSolver
    ) CoprocessorAdapter(_taskIssuerAddress, _machineHash) {
        uniswapSolver = IProtocolSolver(_uniswapSolver);
        aaveSolver = IProtocolSolver(_aaveSolver);
    }

    function runExecution(bytes calldata input) external {
        callCoprocessor(input);
        emit ExecutionInitiated(input);
    }

    function handleNotice(bytes memory notice) internal override {
        Action memory action = abi.decode(notice, (Action));
        try this.executeAction(action) returns (bool success) {
            emit IntentProcessed(action.actionType, action.protocol, success);
            processedActions.push(
                ProcessedAction({
                    actionType: action.actionType,
                    protocol: action.protocol,
                    success: success,
                    timestamp: block.timestamp,
                    params: action.params
                })
            );
        } catch Error(string memory reason) {
            emit IntentFailed(action.actionType, action.protocol, reason);
            processedActions.push(
                ProcessedAction({
                    actionType: action.actionType,
                    protocol: action.protocol,
                    success: false,
                    timestamp: block.timestamp,
                    params: action.params
                })
            );
        }
    }

    function executeAction(Action memory action) external returns (bool) {
        if (action.protocol == 1) {
            // UNISWAP
            return executeUniswapAction(action);
        } else if (action.protocol == 2) {
            // AAVE
            return executeAaveAction(action);
        } else if (action.protocol == 0) {
            // GENERIC
            if (action.actionType == 7) { // TRANSFER
                return executeTransfer(
                    action.params.tokenIn,
                    action.params.amount,
                    action.params.recipient
                );
            }
        }
        revert("Unsupported protocol or action");
    }

    function executeUniswapAction(Action memory action) private returns (bool) {
        if (action.actionType == 0) {
            // SWAP
            return
                uniswapSolver.executeSwap(
                    action.params.tokenIn,
                    action.params.tokenOut,
                    action.params.amount,
                    action.params.recipient,
                    action.params.slippage
                );
        }
        revert("Unsupported action for Uniswap");
    }

    function executeAaveAction(Action memory action) private returns (bool) {
        if (action.actionType == 3) {
            // BORROW
            return
                aaveSolver.executeBorrow(
                    action.params.tokenIn,
                    action.params.amount,
                    action.params.recipient,
                    action.params.rateMode
                );
        } else if (action.actionType == 4) {
            // REPAY
            return
                aaveSolver.executeRepay(
                    action.params.tokenIn,
                    action.params.amount,
                    action.params.rateMode
                );
        } else if (action.actionType == 5) {
            // DEPOSIT
            return
                aaveSolver.executeDeposit(
                    action.params.tokenIn,
                    action.params.amount
                );
        } else if (action.actionType == 6) {
            // WITHDRAW
            return
                aaveSolver.executeWithdraw(
                    action.params.tokenIn,
                    action.params.amount,
                    action.params.recipient
                );
        }
        revert("Unsupported action for Aave");
    }

    function executeTransfer(
        address token,
        uint256 amount,
        address recipient
    ) private returns (bool) {
        if (recipient == address(0)) {
            emit IntentFailed(7, 0, "Invalid recipient address");
            return false;
        }

        // Handle ETH transfers
        if (token == address(0) || token == 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE) {
            try this.executeETHTransfer{value: amount}(recipient) {
                emit TransferExecuted(address(0), msg.sender, recipient, amount);
                emit IntentProcessed(7, 0, true);
                return true;
            } catch Error(string memory reason) {
                emit IntentFailed(7, 0, reason);
                return false;
            } catch {
                emit IntentFailed(7, 0, "ETH transfer failed");
                return false;
            }
        }
        
        // Handle ERC20 transfers
        // Mock ERC20 transfer
        emit TransferExecuted(token, msg.sender, recipient, amount);
        emit IntentProcessed(7, 0, true);
        return true;
    }

    function executeETHTransfer(address recipient) external payable {
        require(msg.sender == address(this), "Only self-call allowed");
        (bool success,) = recipient.call{value: msg.value}("");
        require(success, "ETH transfer failed");
    }

    // Add receive() to handle ETH transfers
    receive() external payable {}

    // Getter functions for processed actions
    function getProcessedActionsCount() external view returns (uint256) {
        return processedActions.length;
    }

    function getProcessedAction(
        uint256 index
    ) external view returns (ProcessedAction memory) {
        require(index < processedActions.length, "Index out of bounds");
        return processedActions[index];
    }

    function getProcessedActions(
        uint256 offset,
        uint256 limit
    ) external view returns (ProcessedAction[] memory) {
        require(offset < processedActions.length, "Offset out of bounds");

        uint256 end = offset + limit;
        if (end > processedActions.length) {
            end = processedActions.length;
        }

        uint256 resultLength = end - offset;
        ProcessedAction[] memory result = new ProcessedAction[](resultLength);

        for (uint256 i = 0; i < resultLength; i++) {
            result[i] = processedActions[offset + i];
        }

        return result;
    }
}
