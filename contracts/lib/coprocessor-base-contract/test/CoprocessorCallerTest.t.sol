//SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {Counter} from "./utils/Counter.sol";
import {console} from "forge-std/console.sol";
import {CoprocessorMock} from "./mock/CoprocessorMock.sol";
import {CoprocessorAdapterSample} from "./utils/CoprocessorAdapterSample.sol";

contract TestCoprocessorAdapterSampl is Test {
    address caller = vm.addr(4);

    bytes32 machineHash = bytes32(0);

    Counter counter;
    CoprocessorMock mock;
    CoprocessorAdapterSample sample;

    function setUp() public {
        counter = new Counter();
        mock = new CoprocessorMock();
        sample = new CoprocessorAdapterSample(address(mock), machineHash);
    }

    function testCallCoprocessorAdapterSampleWithValilNoticeInput() public {
        bytes memory encoded_tx = abi.encodeWithSignature("setNumber(uint256)", 1596);

        bytes memory payload = abi.encode(address(counter), encoded_tx);

        sample.runExecution(payload);

        bytes memory notice = abi.encodeWithSignature("Notice(bytes)", payload);

        bytes[] memory outputs = new bytes[](1);
        outputs[0] = notice;

        vm.expectEmit();

        emit CoprocessorMock.TaskIssued(machineHash, payload, address(sample));

        sample.runExecution(payload);

        vm.prank(address(mock));

        sample.coprocessorCallbackOutputsOnly(machineHash, keccak256(payload), outputs);

        uint256 number = counter.number();
        assertEq(number, 1596);
    }

    function testCallCoprocessorAdapterSampleWithValidVoucherInput() public {
        bytes memory encoded_tx = abi.encodeWithSignature("setNumber(uint256)", 1596);

        bytes memory payload = abi.encode(address(counter), encoded_tx);

        sample.runExecution(payload);

        bytes memory voucher =
            abi.encodeWithSignature("Voucher(address,uint256,bytes)", address(counter), 0, encoded_tx);

        bytes[] memory outputs = new bytes[](1);
        outputs[0] = voucher;

        vm.expectEmit();

        emit CoprocessorMock.TaskIssued(machineHash, payload, address(sample));

        sample.runExecution(payload);

        vm.prank(address(mock));

        sample.coprocessorCallbackOutputsOnly(machineHash, keccak256(payload), outputs);

        uint256 number = counter.number();
        assertEq(number, 1596);
    }

    function testCallCoprocessorAdapterSampleWithValidVoucherInputAndValue() public {
        bytes memory encoded_tx = abi.encodeWithSignature("setNumberPaid(uint256)", 1596);

        bytes memory payload = abi.encode(address(counter), encoded_tx);

        sample.runExecution(payload);

        bytes memory voucher =
            abi.encodeWithSignature("Voucher(address,uint256,bytes)", address(counter), 1596, encoded_tx);

        bytes[] memory outputs = new bytes[](1);
        outputs[0] = voucher;

        vm.expectEmit();

        emit CoprocessorMock.TaskIssued(machineHash, payload, address(sample));

        vm.deal(address(sample), 2024);

        sample.runExecution(payload);

        vm.prank(address(mock));

        sample.coprocessorCallbackOutputsOnly(machineHash, keccak256(payload), outputs);

        uint256 number = counter.number();
        assertEq(number, 1596);
    }

    function testCallCoprocessorAdapterSampleWithInvalidMachineHash() public {
        bytes memory encoded_tx = abi.encodeWithSignature("setNumber(uint256)", 1596);

        bytes memory payload = abi.encode(address(counter), encoded_tx);

        sample.runExecution(payload);

        bytes memory notice = abi.encodeWithSignature("Notice(bytes)", payload);

        bytes[] memory outputs = new bytes[](1);
        outputs[0] = notice;

        vm.expectEmit();

        emit CoprocessorMock.TaskIssued(machineHash, payload, address(sample));

        sample.runExecution(payload);

        vm.prank(address(mock));

        bytes32 invalidMachineHash = keccak256("1596");

        vm.expectRevert();

        sample.coprocessorCallbackOutputsOnly(invalidMachineHash, keccak256(payload), outputs);
    }

    function testCallCoprocessorAdapterSampleWithInvalidPayloadHash() public {
        bytes memory encoded_tx = abi.encodeWithSignature("setNumber(uint256)", 1596);

        bytes memory payload = abi.encode(address(counter), encoded_tx);

        sample.runExecution(payload);

        bytes memory notice = abi.encodeWithSignature("Notice(bytes)", payload);

        bytes[] memory outputs = new bytes[](1);
        outputs[0] = notice;

        vm.expectEmit();

        emit CoprocessorMock.TaskIssued(machineHash, payload, address(sample));

        sample.runExecution(payload);

        vm.prank(address(mock));

        bytes32 invalidPayloadHash = keccak256("1596");

        vm.expectRevert();

        sample.coprocessorCallbackOutputsOnly(machineHash, invalidPayloadHash, outputs);
    }
}
