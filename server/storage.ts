import { 
  User, InsertUser, Token, InsertToken, 
  UserBalance, InsertUserBalance, Transaction, InsertTransaction,
  TokenPrice, InsertTokenPrice
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByWalletAddress(walletAddress: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Token methods
  getToken(id: number): Promise<Token | undefined>;
  getTokenBySymbol(symbol: string): Promise<Token | undefined>;
  getAllTokens(): Promise<Token[]>;
  createToken(token: InsertToken): Promise<Token>;
  
  // User Balance methods
  getUserBalance(userId: number, tokenId: number): Promise<UserBalance | undefined>;
  getUserBalances(userId: number): Promise<UserBalance[]>;
  createOrUpdateUserBalance(balance: InsertUserBalance): Promise<UserBalance>;
  
  // Transaction methods
  getTransaction(id: number): Promise<Transaction | undefined>;
  getUserTransactions(userId: number, limit?: number): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  updateTransactionStatus(id: number, status: string, txHash?: string): Promise<Transaction | undefined>;
  
  // Token Price methods
  getTokenPrice(tokenId: number): Promise<TokenPrice | undefined>;
  getAllTokenPrices(): Promise<TokenPrice[]>;
  createOrUpdateTokenPrice(tokenPrice: InsertTokenPrice): Promise<TokenPrice>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private tokens: Map<number, Token>;
  private userBalances: Map<string, UserBalance>; // key: userId-tokenId
  private transactions: Map<number, Transaction>;
  private tokenPrices: Map<number, TokenPrice>; // key: tokenId
  
  private currentUserId: number;
  private currentTokenId: number;
  private currentBalanceId: number;
  private currentTransactionId: number;
  private currentTokenPriceId: number;

  constructor() {
    this.users = new Map();
    this.tokens = new Map();
    this.userBalances = new Map();
    this.transactions = new Map();
    this.tokenPrices = new Map();
    
    this.currentUserId = 1;
    this.currentTokenId = 1;
    this.currentBalanceId = 1;
    this.currentTransactionId = 1;
    this.currentTokenPriceId = 1;
    
    // Initialize with some default tokens for testing
    this.initializeDefaultTokens();
  }

  private initializeDefaultTokens() {
    const defaultTokens: InsertToken[] = [
      { symbol: "ETH", name: "Ethereum", logoUrl: "https://cryptologos.cc/logos/ethereum-eth-logo.svg", decimals: 18, contractAddress: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE", network: "ethereum" },
      { symbol: "BTC", name: "Bitcoin", logoUrl: "https://cryptologos.cc/logos/bitcoin-btc-logo.svg", decimals: 8, contractAddress: "0x", network: "bitcoin" },
      { symbol: "USDT", name: "Tether", logoUrl: "https://cryptologos.cc/logos/tether-usdt-logo.svg", decimals: 6, contractAddress: "0xdAC17F958D2ee523a2206206994597C13D831ec7", network: "ethereum" },
      { symbol: "SOL", name: "Solana", logoUrl: "https://cryptologos.cc/logos/solana-sol-logo.svg", decimals: 9, contractAddress: "0x", network: "solana" },
      { symbol: "ADA", name: "Cardano", logoUrl: "https://cryptologos.cc/logos/cardano-ada-logo.svg", decimals: 6, contractAddress: "0x", network: "cardano" },
    ];
    
    defaultTokens.forEach(token => this.createToken(token));
    
    // Add default token prices
    const defaultPrices: InsertTokenPrice[] = [
      { tokenId: 1, price: "3245.67", priceChange24h: "2.45", volume24h: "1000000000" },
      { tokenId: 2, price: "44782.09", priceChange24h: "1.87", volume24h: "2500000000" },
      { tokenId: 3, price: "1.00", priceChange24h: "0.01", volume24h: "5000000000" },
      { tokenId: 4, price: "98.34", priceChange24h: "-0.65", volume24h: "750000000" },
      { tokenId: 5, price: "0.4523", priceChange24h: "3.12", volume24h: "300000000" },
    ];
    
    defaultPrices.forEach(price => this.createOrUpdateTokenPrice(price));
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }
  
  async getUserByWalletAddress(walletAddress: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.walletAddress === walletAddress,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { 
      ...insertUser, 
      id, 
      createdAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }
  
  // Token methods
  async getToken(id: number): Promise<Token | undefined> {
    return this.tokens.get(id);
  }
  
  async getTokenBySymbol(symbol: string): Promise<Token | undefined> {
    return Array.from(this.tokens.values()).find(
      (token) => token.symbol === symbol,
    );
  }
  
  async getAllTokens(): Promise<Token[]> {
    return Array.from(this.tokens.values());
  }
  
  async createToken(insertToken: InsertToken): Promise<Token> {
    const id = this.currentTokenId++;
    const token: Token = { ...insertToken, id };
    this.tokens.set(id, token);
    return token;
  }
  
  // User Balance methods
  async getUserBalance(userId: number, tokenId: number): Promise<UserBalance | undefined> {
    return this.userBalances.get(`${userId}-${tokenId}`);
  }
  
  async getUserBalances(userId: number): Promise<UserBalance[]> {
    return Array.from(this.userBalances.values()).filter(
      (balance) => balance.userId === userId,
    );
  }
  
  async createOrUpdateUserBalance(insertBalance: InsertUserBalance): Promise<UserBalance> {
    const key = `${insertBalance.userId}-${insertBalance.tokenId}`;
    const existingBalance = this.userBalances.get(key);
    
    if (existingBalance) {
      const updatedBalance = {
        ...existingBalance,
        balance: insertBalance.balance,
        updatedAt: new Date(),
      };
      this.userBalances.set(key, updatedBalance);
      return updatedBalance;
    } else {
      const id = this.currentBalanceId++;
      const newBalance: UserBalance = {
        ...insertBalance,
        id,
        updatedAt: new Date(),
      };
      this.userBalances.set(key, newBalance);
      return newBalance;
    }
  }
  
  // Transaction methods
  async getTransaction(id: number): Promise<Transaction | undefined> {
    return this.transactions.get(id);
  }
  
  async getUserTransactions(userId: number, limit: number = 10): Promise<Transaction[]> {
    return Array.from(this.transactions.values())
      .filter((tx) => tx.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }
  
  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const id = this.currentTransactionId++;
    const now = new Date();
    const transaction: Transaction = {
      ...insertTransaction,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.transactions.set(id, transaction);
    return transaction;
  }
  
  async updateTransactionStatus(id: number, status: string, txHash?: string): Promise<Transaction | undefined> {
    const transaction = this.transactions.get(id);
    if (!transaction) return undefined;
    
    const updatedTransaction = {
      ...transaction,
      status,
      txHash: txHash || transaction.txHash,
      updatedAt: new Date(),
    };
    
    this.transactions.set(id, updatedTransaction);
    return updatedTransaction;
  }
  
  // Token Price methods
  async getTokenPrice(tokenId: number): Promise<TokenPrice | undefined> {
    return this.tokenPrices.get(tokenId);
  }
  
  async getAllTokenPrices(): Promise<TokenPrice[]> {
    return Array.from(this.tokenPrices.values());
  }
  
  async createOrUpdateTokenPrice(insertTokenPrice: InsertTokenPrice): Promise<TokenPrice> {
    const existingPrice = this.tokenPrices.get(insertTokenPrice.tokenId);
    
    if (existingPrice) {
      const updatedPrice = {
        ...existingPrice,
        price: insertTokenPrice.price,
        priceChange24h: insertTokenPrice.priceChange24h,
        volume24h: insertTokenPrice.volume24h,
        updatedAt: new Date(),
      };
      this.tokenPrices.set(insertTokenPrice.tokenId, updatedPrice);
      return updatedPrice;
    } else {
      const id = this.currentTokenPriceId++;
      const newPrice: TokenPrice = {
        ...insertTokenPrice,
        id,
        updatedAt: new Date(),
      };
      this.tokenPrices.set(insertTokenPrice.tokenId, newPrice);
      return newPrice;
    }
  }
}

export const storage = new MemStorage();
