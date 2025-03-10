import PriceOverview from "@/components/PriceOverview";
import PriceChart from "@/components/PriceChart";
import PortfolioOverview from "@/components/PortfolioOverview";
import TransactionHistoryItem from "@/components/TransactionHistoryItem";
import MarketTrends from "@/components/MarketTrends";
import SwapInterface from "@/components/SwapInterface";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SpotTradingInterface from "@/components/SpotTradingInterface";
import { useWeb3 } from "@/lib/web3";
import { useQuery } from "@tanstack/react-query";
import { fetchTransactions } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

const Dashboard = () => {
  const { address } = useWeb3();
  
  const { data: transactions } = useQuery({
    queryKey: address ? [`/api/transactions/${address}`] : null,
    enabled: !!address
  });

  return (
    <div>
      {/* Market Overview */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold">Market Overview</h2>
          <button 
            className="text-sm text-neutral-400 hover:text-white"
            onClick={() => window.location.reload()}
          >
            <i className="ri-refresh-line mr-1"></i> Refresh
          </button>
        </div>
        
        <PriceOverview />
      </section>

      {/* Main Features Area */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Panel (Swap & Spot Trading) */}
        <div className="xl:col-span-2 space-y-6">
          {/* Price Chart */}
          <PriceChart />

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
                transactions.slice(0, 3).map((transaction) => (
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
        
        {/* Right Panel (Portfolio) */}
        <div className="space-y-6">
          {/* Portfolio Overview */}
          <PortfolioOverview />
          
          {/* Market Trends */}
          <MarketTrends />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
