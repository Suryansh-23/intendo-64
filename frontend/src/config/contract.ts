import { Address } from 'viem';

export const INTENDO_CONTRACT_ADDRESS: Address = '0x948B3c65b89DF0B4894ABE91E6D02FE579834F8F'; // This is default Anvil deployment address

export const INTENDO_ABI = [
  {
    "inputs": [
      { "internalType": "bytes", "name": "input", "type": "bytes" }
    ],
    "name": "runExecution",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "bytes",
        "name": "input",
        "type": "bytes"
      }
    ],
    "name": "ExecutionInitiated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint8",
        "name": "actionType",
        "type": "uint8"
      },
      {
        "indexed": true,
        "internalType": "uint8",
        "name": "protocol",
        "type": "uint8"
      },
      {
        "indexed": false,
        "internalType": "bool",
        "name": "success",
        "type": "bool"
      }
    ],
    "name": "IntentProcessed",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint8",
        "name": "actionType",
        "type": "uint8"
      },
      {
        "indexed": true,
        "internalType": "uint8",
        "name": "protocol",
        "type": "uint8"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "reason",
        "type": "string"
      }
    ],
    "name": "IntentFailed",
    "type": "event"
  }
] as const;