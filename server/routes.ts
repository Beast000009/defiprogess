import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertUserSchema, 
  swapTokensSchema, 
  spotTradeSchema,
  insertUserBalanceSchema,
  insertTransactionSchema
} from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import fetch from "node-fetch";

// Utility to handle API errors
const handleApiError = (res: any, error: unknown) => {
  console.error("API Error:", error);
  
  if (error instanceof ZodError) {
    return res.status(400).json({ 
      message: fromZodError(error).message 
    });
  }
  
  return res.status(500).json({ 
    message: error instanceof Error ? error.message : "An unknown error occurred" 
  });
};

// Simulate network fee for blockchain transactions
const simulateNetworkFee = () => {
  // Returns a fee between 0.001 and 0.01 ETH (in string format)
  const fee = (Math.random() * 0.009 + 0.001).toFixed(6);
  return fee;
};

// Simulate transaction hash for blockchain transactions
const simulateTxHash = () => {
  return "0x" + Array(64).fill(0).map(() => 
    Math.floor(Math.random() * 16).toString(16)
  ).join("");
};

// Get token price from CoinGecko
const getTokenPrice = async (tokenSymbol: string) => {
  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${tokenSymbol.toLowerCase()}&vs_currencies=usd&include_24hr_change=true`
    );
    
    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }
    
    const data = await response.json();
    if (data[tokenSymbol.toLowerCase()]) {
      return {
        price: data[tokenSymbol.toLowerCase()].usd.toString(),
        priceChange24h: data[tokenSymbol.toLowerCase()].usd_24h_change.toFixed(2)
      };
    }
    
    throw new Error(`Price data not found for ${tokenSymbol}`);
  } catch (error) {
    console.error("Failed to fetch token price:", error);
    // Fallback to stored price
    return null;
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  // API routes - prefix with /api
  
  // Get all tokens
  app.get("/api/tokens", async (req, res) => {
    try {
      const tokens = await storage.getAllTokens();
      return res.json(tokens);
    } catch (error) {
      return handleApiError(res, error);
    }
  });
  
  // Get token prices
  app.get("/api/prices", async (req, res) => {
    try {
      const tokenPrices = await storage.getAllTokenPrices();
      const tokens = await storage.getAllTokens();
      
      const result = await Promise.all(
        tokens.map(async (token) => {
          const tokenPrice = tokenPrices.find(tp => tp.tokenId === token.id);
          
          // Try to get real-time price from CoinGecko
          const livePrice = await getTokenPrice(token.symbol);
          
          return {
            id: token.id,
            symbol: token.symbol,
            name: token.name,
            logoUrl: token.logoUrl,
            price: livePrice?.price || tokenPrice?.price || "0",
            priceChange24h: livePrice?.priceChange24h || tokenPrice?.priceChange24h || "0",
          };
        })
      );
      
      return res.json(result);
    } catch (error) {
      return handleApiError(res, error);
    }
  });
  
  // Get user portfolio (balances with token info)
  app.get("/api/portfolio/:walletAddress", async (req, res) => {
    try {
      const { walletAddress } = req.params;
      
      let user = await storage.getUserByWalletAddress(walletAddress);
      
      // If user doesn't exist, create a new one
      if (!user) {
        user = await storage.createUser({
          username: `user_${Math.floor(Math.random() * 10000)}`,
          password: "password", // This is a demo app
          walletAddress
        });
        
        // Add some demo balances
        const tokens = await storage.getAllTokens();
        for (const token of tokens) {
          const randomBalance = token.symbol === "USDT" ? 
            (Math.random() * 5000 + 1000).toFixed(2) : 
            (Math.random() * 5 + 0.1).toFixed(token.symbol === "BTC" ? 8 : 4);
            
          await storage.createOrUpdateUserBalance({
            userId: user.id,
            tokenId: token.id,
            balance: randomBalance
          });
        }
      }
      
      const balances = await storage.getUserBalances(user.id);
      const tokens = await storage.getAllTokens();
      const tokenPrices = await storage.getAllTokenPrices();
      
      const portfolio = await Promise.all(
        balances.map(async (balance) => {
          const token = tokens.find(t => t.id === balance.tokenId);
          const tokenPrice = tokenPrices.find(tp => tp.tokenId === balance.tokenId);
          
          if (!token || !tokenPrice) return null;
          
          // Try to get real-time price from CoinGecko
          const livePrice = await getTokenPrice(token.symbol);
          const price = livePrice?.price || tokenPrice.price;
          
          return {
            id: balance.id,
            token: {
              id: token.id,
              symbol: token.symbol,
              name: token.name,
              logoUrl: token.logoUrl,
            },
            balance: balance.balance,
            value: (parseFloat(balance.balance) * parseFloat(price)).toFixed(2),
            price: price,
          };
        })
      );
      
      // Filter out null values
      const filteredPortfolio = portfolio.filter(item => item !== null);
      
      // Calculate total value
      const totalValue = filteredPortfolio.reduce(
        (sum, item) => sum + parseFloat(item!.value), 
        0
      ).toFixed(2);
      
      return res.json({
        walletAddress,
        totalValue,
        assets: filteredPortfolio
      });
    } catch (error) {
      return handleApiError(res, error);
    }
  });
  
  // Get recent transactions
  app.get("/api/transactions/:walletAddress", async (req, res) => {
    try {
      const { walletAddress } = req.params;
      
      const user = await storage.getUserByWalletAddress(walletAddress);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const transactions = await storage.getUserTransactions(user.id, 10);
      const tokens = await storage.getAllTokens();
      
      const txWithDetails = transactions.map(tx => {
        const fromToken = tokens.find(t => t.id === tx.fromTokenId);
        const toToken = tokens.find(t => t.id === tx.toTokenId);
        
        return {
          id: tx.id,
          type: tx.type,
          status: tx.status,
          fromToken: fromToken ? {
            id: fromToken.id,
            symbol: fromToken.symbol,
            name: fromToken.name,
            logoUrl: fromToken.logoUrl,
          } : null,
          toToken: toToken ? {
            id: toToken.id,
            symbol: toToken.symbol,
            name: toToken.name,
            logoUrl: toToken.logoUrl,
          } : null,
          fromAmount: tx.fromAmount,
          toAmount: tx.toAmount,
          price: tx.price,
          txHash: tx.txHash,
          networkFee: tx.networkFee,
          createdAt: tx.createdAt,
          timestamp: tx.createdAt.getTime(),
        };
      });
      
      return res.json(txWithDetails);
    } catch (error) {
      return handleApiError(res, error);
    }
  });
  
  // Swap tokens
  app.post("/api/swap", async (req, res) => {
    try {
      const swapData = swapTokensSchema.parse(req.body);
      
      const fromToken = await storage.getToken(swapData.fromTokenId);
      const toToken = await storage.getToken(swapData.toTokenId);
      
      if (!fromToken || !toToken) {
        return res.status(404).json({ message: "Token not found" });
      }
      
      // Get user by wallet address or create if not exists
      let user = await storage.getUserByWalletAddress(swapData.walletAddress || "");
      
      if (!user && swapData.walletAddress) {
        user = await storage.createUser({
          username: `user_${Math.floor(Math.random() * 10000)}`,
          password: "password", // This is a demo app
          walletAddress: swapData.walletAddress
        });
      }
      
      if (!user) {
        return res.status(400).json({ message: "Wallet address is required" });
      }
      
      // Get token prices
      const fromTokenPrice = await storage.getTokenPrice(fromToken.id);
      const toTokenPrice = await storage.getTokenPrice(toToken.id);
      
      if (!fromTokenPrice || !toTokenPrice) {
        return res.status(404).json({ message: "Token price not found" });
      }
      
      // Calculate exchange rate and amount to receive
      const fromAmount = parseFloat(swapData.fromAmount);
      const rate = parseFloat(toTokenPrice.price) / parseFloat(fromTokenPrice.price);
      const toAmount = (fromAmount * rate).toFixed(toToken.decimals);
      
      // Check if user has sufficient balance
      const userFromBalance = await storage.getUserBalance(user.id, fromToken.id);
      
      if (!userFromBalance || parseFloat(userFromBalance.balance) < fromAmount) {
        return res.status(400).json({ message: "Insufficient balance" });
      }
      
      // Create transaction
      const networkFee = simulateNetworkFee();
      
      const transaction = await storage.createTransaction({
        userId: user.id,
        type: "swap",
        status: "pending",
        fromTokenId: fromToken.id,
        toTokenId: toToken.id,
        fromAmount: fromAmount.toString(),
        toAmount,
        price: fromTokenPrice.price,
        networkFee,
        metadata: { 
          rate: rate.toString(),
          priceImpact: "0.05"
        }
      });
      
      // Simulate transaction confirmation (would be a blockchain call in production)
      setTimeout(async () => {
        // Update transaction status
        const txHash = simulateTxHash();
        await storage.updateTransactionStatus(transaction.id, "completed", txHash);
        
        // Update user balances
        const updatedFromBalance = (parseFloat(userFromBalance.balance) - fromAmount).toString();
        await storage.createOrUpdateUserBalance({
          userId: user.id,
          tokenId: fromToken.id,
          balance: updatedFromBalance
        });
        
        // Update or create to balance
        const userToBalance = await storage.getUserBalance(user.id, toToken.id);
        const updatedToBalance = userToBalance 
          ? (parseFloat(userToBalance.balance) + parseFloat(toAmount)).toString()
          : toAmount;
          
        await storage.createOrUpdateUserBalance({
          userId: user.id,
          tokenId: toToken.id,
          balance: updatedToBalance
        });
      }, 2000);
      
      return res.json({
        transactionId: transaction.id,
        status: transaction.status,
        fromToken: {
          id: fromToken.id,
          symbol: fromToken.symbol,
          name: fromToken.name,
        },
        toToken: {
          id: toToken.id,
          symbol: toToken.symbol,
          name: toToken.name,
        },
        fromAmount: swapData.fromAmount,
        toAmount,
        rate: rate.toString(),
        networkFee,
      });
    } catch (error) {
      return handleApiError(res, error);
    }
  });
  
  // Spot trade (buy/sell)
  app.post("/api/trade", async (req, res) => {
    try {
      const tradeData = spotTradeSchema.parse(req.body);
      
      const token = await storage.getToken(tradeData.tokenId);
      const baseToken = await storage.getToken(tradeData.baseTokenId);
      
      if (!token || !baseToken) {
        return res.status(404).json({ message: "Token not found" });
      }
      
      // Get user by wallet address or create if not exists
      let user = await storage.getUserByWalletAddress(tradeData.walletAddress || "");
      
      if (!user && tradeData.walletAddress) {
        user = await storage.createUser({
          username: `user_${Math.floor(Math.random() * 10000)}`,
          password: "password", // This is a demo app
          walletAddress: tradeData.walletAddress
        });
      }
      
      if (!user) {
        return res.status(400).json({ message: "Wallet address is required" });
      }
      
      const amount = parseFloat(tradeData.amount);
      const price = parseFloat(tradeData.price);
      const total = amount * price;
      
      // For buy: check if user has enough baseToken (e.g., USDT)
      // For sell: check if user has enough token (e.g., ETH)
      const sourceTokenId = tradeData.type === "buy" ? baseToken.id : token.id;
      const sourceAmount = tradeData.type === "buy" ? total : amount;
      
      const userSourceBalance = await storage.getUserBalance(user.id, sourceTokenId);
      
      if (!userSourceBalance || parseFloat(userSourceBalance.balance) < sourceAmount) {
        return res.status(400).json({ message: "Insufficient balance" });
      }
      
      // Create transaction
      const networkFee = simulateNetworkFee();
      
      const fromTokenId = tradeData.type === "buy" ? baseToken.id : token.id;
      const toTokenId = tradeData.type === "buy" ? token.id : baseToken.id;
      const fromAmount = tradeData.type === "buy" ? total.toString() : amount.toString();
      const toAmount = tradeData.type === "buy" ? amount.toString() : total.toString();
      
      const transaction = await storage.createTransaction({
        userId: user.id,
        type: tradeData.type,
        status: "pending",
        fromTokenId,
        toTokenId,
        fromAmount,
        toAmount,
        price: price.toString(),
        networkFee,
        metadata: { 
          pair: `${token.symbol}/${baseToken.symbol}`,
        }
      });
      
      // Simulate transaction confirmation (would be a blockchain call in production)
      setTimeout(async () => {
        // Update transaction status
        const txHash = simulateTxHash();
        await storage.updateTransactionStatus(transaction.id, "completed", txHash);
        
        // Update user balances
        // Decrease source balance
        const updatedSourceBalance = (parseFloat(userSourceBalance.balance) - sourceAmount).toString();
        await storage.createOrUpdateUserBalance({
          userId: user.id,
          tokenId: sourceTokenId,
          balance: updatedSourceBalance
        });
        
        // Increase target balance
        const targetTokenId = tradeData.type === "buy" ? token.id : baseToken.id;
        const targetAmount = tradeData.type === "buy" ? amount : total;
        
        const userTargetBalance = await storage.getUserBalance(user.id, targetTokenId);
        const updatedTargetBalance = userTargetBalance 
          ? (parseFloat(userTargetBalance.balance) + targetAmount).toString()
          : targetAmount.toString();
          
        await storage.createOrUpdateUserBalance({
          userId: user.id,
          tokenId: targetTokenId,
          balance: updatedTargetBalance
        });
      }, 2000);
      
      return res.json({
        transactionId: transaction.id,
        status: transaction.status,
        type: tradeData.type,
        token: {
          id: token.id,
          symbol: token.symbol,
          name: token.name,
        },
        baseToken: {
          id: baseToken.id,
          symbol: baseToken.symbol,
          name: baseToken.name,
        },
        amount: tradeData.amount,
        price: tradeData.price,
        total: total.toString(),
        networkFee,
      });
    } catch (error) {
      return handleApiError(res, error);
    }
  });
  
  // Get gas price (simulated)
  app.get("/api/gas-price", async (req, res) => {
    try {
      // In a real app, this would call an actual gas price API
      const gasPrice = Math.floor(Math.random() * 70) + 20; // 20-90 Gwei
      
      return res.json({
        gasPrice: `${gasPrice}`,
        unit: "Gwei",
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      return handleApiError(res, error);
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
