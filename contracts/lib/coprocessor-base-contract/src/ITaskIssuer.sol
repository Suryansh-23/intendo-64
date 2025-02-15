// SPDX-License-Identifier: MIT

pragma solidity 0.8.28;

/// @title ICoprocessor Interface
/// @notice Defines the interface for interacting with a coprocessor contract
interface ITaskIssuer {
    /// @notice Issues a task to the coprocessor
    /// @param machineHash The hash of the machine to which the task is assigned
    /// @param input The ABI-encoded input data for the task
    /// @param callbackAddress The address to which the callback will be sent upon task completion
    function issueTask(bytes32 machineHash, bytes calldata input, address callbackAddress) external;
}
