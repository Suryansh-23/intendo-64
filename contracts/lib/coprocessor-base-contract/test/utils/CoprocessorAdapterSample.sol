//SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "../../src/CoprocessorAdapter.sol";

contract CoprocessorAdapterSample is CoprocessorAdapter {
    constructor(address _coprocessorAddress, bytes32 _machineHash)
        CoprocessorAdapter(_coprocessorAddress, _machineHash)
    {}

    function handleNotice(bytes memory notice) internal override {
        address destination;
        bytes memory decodedPayload;

        (destination, decodedPayload) = abi.decode(notice, (address, bytes));

        bool success;
        bytes memory returndata;

        (success, returndata) = destination.call(decodedPayload);
    }

    function runExecution(bytes calldata input) external {
        callCoprocessor(input);
    }
}
