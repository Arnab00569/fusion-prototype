export const FUSION_ADDRESSES = {
  CREDIT_PASSPORT: "0x6Ab09C2FE9595BB55864a41C1112e91694B02562",
  CREDIT_ENGINE: "0x22f67E154da4428368883ac29821F78dB6bD4ee4",
  MOCK_USDC: "0x8536e386C2F063f44909C8E79B70947f5F635299",
  LENDING_POOL: "0x7ADE55089a0DE7d860a4fba8a61D3579720181F4",
} as const;

export const CREDIT_PASSPORT_ABI = [
  {
    inputs: [{ name: "user", type: "address" }],
    name: "getProfile",
    outputs: [
      { name: "score", type: "uint256" },
      { name: "trustMomentum", type: "uint256" },
      { name: "successfulRepayments", type: "uint256" },
      { name: "liquidations", type: "uint256" },
      { name: "currentBorrowed", type: "uint256" },
      { name: "initialized", type: "bool" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "initializeMyProfile",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "protocol", type: "address" },
      { name: "status", type: "bool" }
    ],
    name: "setAuthorizedProtocol",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  }
] as const;

export const MOCK_USDC_ABI = [
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "mint",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "faucet",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  }
] as const;

export const LENDING_POOL_ABI = [
  {
    inputs: [{ name: "borrowAmount", type: "uint256" }],
    name: "borrow",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "repay",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "", type: "address" }],
    name: "activeLoans",
    outputs: [
      { name: "borrower", type: "address" },
      { name: "principal", type: "uint256" },
      { name: "collateral", type: "uint256" },
      { name: "totalDue", type: "uint256" },
      { name: "active", type: "bool" }
    ],
    stateMutability: "view",
    type: "function",
  }
] as const;