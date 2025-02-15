// SPDX-License-Identifier: MIT

pragma solidity 0.8.28;

/// @title ICoprocessorCallback Interface
/// @notice Defines the callback mechanism for handling coprocessor outputs
interface ICoprocessorCallback {
    /// @notice Handles outputs from the coprocessor
    /// @param machineHash The hash of the machine that processed the task
    /// @param payloadHash The hash of the input payload that generated these outputs
    /// @param outputs Array of ABI-encoded outputs from the coprocessor
    function coprocessorCallbackOutputsOnly(bytes32 machineHash, bytes32 payloadHash, bytes[] calldata outputs)
        external;
}
