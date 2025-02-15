## Co-Processor base contract

**This is a base contract containing functions for calling with the co-processor and also a callback function to receive response from the co-processor. This function can be overridden where necessary or in the most simple implementation just the "handleCallback" function can be overridden to contain implementations to handle response from the co-processor.**

## Usage

### Installation

- Install the base contract by running the following command:

```shell
forge install https://github.com/Mugen-Builders/coprocessor-base-contract
```

- Import the base contract into your project through the following command:

```solidity
import "cartesi-coprocessor-base-contract/BaseContract.sol";
```

- Inherit the base contract and also populate the constructor parameters:

```solidity
contract MyContract is CoprocessorAdapter {
    constructor(address _taskIssuerAddress, bytes32 _machineHash)
        CoprocessorAdapter(_taskIssuerAddress, _machineHash)
    {}
    // Add your Logic here
}
```

### Authors

- Carsten Munk
- Henrique Marlon
- Idogwu Chinonso
