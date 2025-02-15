// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Script.sol";
import "../src/Intendo.sol";
import "../src/solvers/UniswapSolver.sol";
import "../src/solvers/AaveSolver.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address taskIssuerAddress = vm.envAddress("TASK_ISSUER_ADDRESS");
        bytes32 machineHash = vm.envBytes32("MACHINE_HASH");

        vm.startBroadcast(deployerPrivateKey);

        // Deploy protocol solvers
        UniswapSolver uniswapSolver = new UniswapSolver();
        console.log("UniswapSolver deployed at:", address(uniswapSolver));

        AaveSolver aaveSolver = new AaveSolver();
        console.log("AaveSolver deployed at:", address(aaveSolver));

        // Deploy main Intendo contract
        Intendo intendo = new Intendo(
            taskIssuerAddress,
            machineHash,
            address(uniswapSolver),
            address(aaveSolver)
        );
        console.log("Intendo deployed at:", address(intendo));

        vm.stopBroadcast();
    }
}
