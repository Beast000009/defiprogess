import PriceChart from "@/components/PriceChart";
import PortfolioOverview from "@/components/PortfolioOverview";
import TransactionHistoryItem from "@/components/TransactionHistoryItem";
import SwapInterface from "@/components/SwapInterface";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import SpotTradingInterface from "@/components/SpotTradingInterface";
import { useWeb3 } from "@/lib/web3";
import { useQuery } from "@tanstack/react-query";
import { fetchTransactions, fetchTokenPrices, TokenPrice, formatPriceChange } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useState } from "react";

const Dashboard = () => {
  const { address } = useWeb3();
  const [selectedToken, setSelectedToken] = useState<string>("ETH");

  const { data: transactions } = useQuery({
    queryKey: address ? [`/api/transactions/${address}`] : null,
    enabled: !!address
  });

  const { data: tokenPrices } = useQuery<TokenPrice[]>({
    queryKey: ['/api/prices'],
    refetchInterval: 30000
  });

  return (
    <div>
      <div className="space-y-6">
        {/* Chart and Token List Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Price Chart */}
          <div className="md:col-span-1 bg-neutral-800 rounded-xl border border-neutral-700 p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Price Chart</h2>
              <span className="text-neutral-400">{selectedToken}/USD</span>
            </div>
            <PriceChart tokenSymbol={selectedToken} />
          </div>

          {/* Cryptocurrency List */}
          <div className="md:col-span-1 bg-neutral-800 rounded-xl border border-neutral-700 p-4">
            <h3 className="font-medium mb-4">Available Cryptocurrencies</h3>
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-2">
                {tokenPrices?.map((token) => (
                  <button
                    key={token.id}
                    onClick={() => setSelectedToken(token.symbol)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                      selectedToken === token.symbol ? 'bg-primary bg-opacity-20 text-primary-light' : 'bg-neutral-700 hover:bg-neutral-600'
                    }`}
                  >
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-neutral-600 flex items-center justify-center overflow-hidden mr-2">
                        <img src={token.logoUrl} alt={token.symbol} className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <div className="font-medium">{token.symbol}</div>
                        <div className="text-xs text-neutral-400">{token.name}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-mono">${parseFloat(token.price).toFixed(2)}</div>
                      <div className={`text-xs ${parseFloat(token.priceChange24h) >= 0 ? 'text-success' : 'text-error'}`}>
                        {formatPriceChange(token.priceChange24h)}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Trading Interface */}
        <div className="bg-neutral-800 rounded-xl border border-neutral-700 p-4">
          <div className="space-y-6">
            {/* Swap and Trade Tabs */}
            <div className="bg-neutral-800 rounded-xl border border-neutral-700">
              <Tabs defaultValue="swap">
                <div className="border-b border-neutral-700">
                  <TabsList className="border-b-0 bg-transparent">
                    <TabsTrigger 
                      value="swap" 
                      className="px-6 py-3 font-medium text-neutral-400 data-[state=active]:text-primary-light data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
                    >
                      Swap
                    </TabsTrigger>
                    <TabsTrigger 
                      value="trade" 
                      className="px-6 py-3 font-medium text-neutral-400 data-[state=active]:text-primary-light data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
                    >
                      Spot Trade
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="swap">
                  <SwapInterface />
                </TabsContent>

                <TabsContent value="trade">
                  <SpotTradingInterface />
                </TabsContent>
              </Tabs>
            </div>

            {/* Recent Transactions */}
            <div className="bg-neutral-800 rounded-xl border border-neutral-700 p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium">Recent Transactions</h3>
                <Link href="/history">
                  <Button variant="ghost" className="text-sm text-neutral-400 hover:text-white" size="sm">
                    See All
                  </Button>
                </Link>
              </div>

              <div className="space-y-3">
                {transactions && transactions.length > 0 ? (
                  transactions.slice(0, 3).map((transaction: any) => (
                    <TransactionHistoryItem key={transaction.id} transaction={transaction} />
                  ))
                ) : address ? (
                  <div className="text-center py-4 text-neutral-400">
                    No transactions found
                  </div>
                ) : (
                  <div className="text-center py-4 text-neutral-400">
                    Connect your wallet to view transactions
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;