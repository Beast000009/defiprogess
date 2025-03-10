import { apiRequest } from "./queryClient";

export interface Token {
  id: number;
  symbol: string;
  name: string;
  logoUrl: string;
  decimals?: number;
  contractAddress?: string;
  network?: string;
}

export interface TokenPrice {
  id: number;
  symbol: string;
  name: string;
  logoUrl: string;
  price: string;
  priceChange24h: string;
}

export interface PortfolioAsset {
  id: number;
  token: {
    id: number;
    symbol: string;
    name: string;
    logoUrl: string;
  };
  balance: string;
  value: string;
  price: string;
}

export interface Portfolio {
  walletAddress: string;
  totalValue: string;
  assets: PortfolioAsset[];
}

export interface Transaction {
  id: number;
  type: string;
  status: string;
  fromToken: {
    id: number;
    symbol: string;
    name: string;
    logoUrl: string;
  } | null;
  toToken: {
    id: number;
    symbol: string;
    name: string;
    logoUrl: string;
  } | null;
  fromAmount: string;
  toAmount: string;
  price: string;
  txHash: string | null;
  networkFee: string;
  createdAt: string;
  timestamp: number;
}

export interface GasPrice {
  gasPrice: string;
  unit: string;
  timestamp: string;
}

export interface SwapParams {
  fromTokenId: number;
  toTokenId: number;
  fromAmount: string;
  walletAddress?: string;
}

export interface SwapResponse {
  transactionId: number;
  status: string;
  fromToken: {
    id: number;
    symbol: string;
    name: string;
  };
  toToken: {
    id: number;
    symbol: string;
    name: string;
  };
  fromAmount: string;
  toAmount: string;
  rate: string;
  networkFee: string;
}

export interface TradeParams {
  tokenId: number;
  baseTokenId: number;
  amount: string;
  price: string;
  type: "buy" | "sell";
  walletAddress?: string;
}

export interface TradeResponse {
  transactionId: number;
  status: string;
  type: "buy" | "sell";
  token: {
    id: number;
    symbol: string;
    name: string;
  };
  baseToken: {
    id: number;
    symbol: string;
    name: string;
  };
  amount: string;
  price: string;
  total: string;
  networkFee: string;
}

// API Functions

export const fetchTokens = async (): Promise<Token[]> => {
  const res = await apiRequest("GET", "/api/tokens");
  return res.json();
};

export const fetchTokenPrices = async (): Promise<TokenPrice[]> => {
  const res = await apiRequest("GET", "/api/prices");
  return res.json();
};

export const fetchPortfolio = async (walletAddress: string): Promise<Portfolio> => {
  const res = await apiRequest("GET", `/api/portfolio/${walletAddress}`);
  return res.json();
};

export const fetchTransactions = async (walletAddress: string): Promise<Transaction[]> => {
  const res = await apiRequest("GET", `/api/transactions/${walletAddress}`);
  return res.json();
};

export const fetchGasPrice = async (): Promise<GasPrice> => {
  const res = await apiRequest("GET", "/api/gas-price");
  return res.json();
};

export const swapTokens = async (params: SwapParams): Promise<SwapResponse> => {
  const res = await apiRequest("POST", "/api/swap", params);
  return res.json();
};

export const executeTrade = async (params: TradeParams): Promise<TradeResponse> => {
  const res = await apiRequest("POST", "/api/trade", params);
  return res.json();
};

// Utility functions for working with token amounts

export const formatTokenAmount = (amount: string | number, decimals: number = 6): string => {
  const parsedAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(parsedAmount)) return '0.00';
  
  if (parsedAmount < 0.000001) {
    return '<0.000001';
  }
  
  if (parsedAmount < 1) {
    return parsedAmount.toFixed(Math.min(decimals, 6));
  }
  
  if (parsedAmount < 1000) {
    return parsedAmount.toFixed(Math.min(decimals, 4));
  }
  
  if (parsedAmount < 1000000) {
    return parsedAmount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }
  
  // Return in millions with 2 decimal places
  return (parsedAmount / 1000000).toFixed(2) + 'M';
};

export const formatUsdValue = (value: string | number): string => {
  const parsedValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(parsedValue)) return '$0.00';
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(parsedValue);
};

export const formatPriceChange = (priceChange: string | number): string => {
  const parsedChange = typeof priceChange === 'string' ? parseFloat(priceChange) : priceChange;
  
  if (isNaN(parsedChange)) return '0.00%';
  
  return (parsedChange >= 0 ? '+' : '') + parsedChange.toFixed(2) + '%';
};

export const getFormattedTimeAgo = (timestamp: number): string => {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  
  if (seconds < 60) {
    return 'just now';
  }
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  }
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  }
  
  const days = Math.floor(hours / 24);
  if (days < 30) {
    return `${days} day${days !== 1 ? 's' : ''} ago`;
  }
  
  const months = Math.floor(days / 30);
  return `${months} month${months !== 1 ? 's' : ''} ago`;
};

export const getStatusColor = (status: string): string => {
  switch (status.toLowerCase()) {
    case 'completed':
      return 'text-success';
    case 'pending':
      return 'text-warning';
    case 'failed':
      return 'text-error';
    default:
      return 'text-neutral-400';
  }
};

export const getTransactionTypeIcon = (type: string): string => {
  switch (type.toLowerCase()) {
    case 'swap':
      return 'ri-arrow-left-right-line';
    case 'buy':
      return 'ri-arrow-down-line';
    case 'sell':
      return 'ri-arrow-up-line';
    default:
      return 'ri-funds-line';
  }
};
