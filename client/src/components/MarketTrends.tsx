import { useQuery } from "@tanstack/react-query";
import { fetchTokenPrices, TokenPrice, formatPriceChange, formatUsdValue } from "@/lib/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { TrendingDown, TrendingUp } from "lucide-react";

const MarketTrends = () => {
  const [period, setPeriod] = useState("24h");

  const { data: tokenPrices, isLoading, error } = useQuery<TokenPrice[]>({
    queryKey: ['/api/prices'],
    refetchInterval: 60000 // Refresh every minute
  });

  if (isLoading) {
    return (
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4">Market Trends</h2>
        <Tabs defaultValue="gainers">
          <div className="flex justify-between items-center mb-4">
            <TabsList>
              <TabsTrigger value="gainers">Top Gainers</TabsTrigger>
              <TabsTrigger value="losers">Top Losers</TabsTrigger>
            </TabsList>
            <div className="flex">
              <Skeleton className="h-8 w-12 rounded-md" />
              <Skeleton className="h-8 w-12 rounded-md ml-2" />
              <Skeleton className="h-8 w-12 rounded-md ml-2" />
            </div>
          </div>

          <TabsContent value="gainers">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="bg-neutral-800 border-neutral-700">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <div className="ml-2">
                          <Skeleton className="h-5 w-16" />
                          <Skeleton className="h-4 w-12 mt-1" />
                        </div>
                      </div>
                      <div className="text-right">
                        <Skeleton className="h-5 w-20 ml-auto" />
                        <Skeleton className="h-4 w-16 mt-1 ml-auto" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="losers">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="bg-neutral-800 border-neutral-700">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <div className="ml-2">
                          <Skeleton className="h-5 w-16" />
                          <Skeleton className="h-4 w-12 mt-1" />
                        </div>
                      </div>
                      <div className="text-right">
                        <Skeleton className="h-5 w-20 ml-auto" />
                        <Skeleton className="h-4 w-16 mt-1 ml-auto" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  if (error || !tokenPrices) {
    return (
      <div className="p-4 bg-neutral-800 rounded-xl border border-red-800 text-red-400 mb-8">
        <p>Error loading market trend data. Please try again later.</p>
      </div>
    );
  }

  // Process the data - sort by price change
  const sortedByChange = [...tokenPrices].sort((a, b) => {
    const changeA = parseFloat(a.priceChange24h || "0");
    const changeB = parseFloat(b.priceChange24h || "0");
    return changeB - changeA;
  });

  // Get top gainers and losers
  const topGainers = sortedByChange.filter(token => 
    parseFloat(token.priceChange24h || "0") > 0
  ).slice(0, 6);

  const topLosers = [...sortedByChange]
    .filter(token => parseFloat(token.priceChange24h || "0") < 0)
    .reverse()
    .slice(0, 6);

  // Format the price with dollar sign
  const formatPrice = (price: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 8
    }).format(parseFloat(price || "0"));
  };

  return (
    <div className="mb-8">
      <h2 className="text-xl font-bold mb-4">Market Trends</h2>
      <Tabs defaultValue="gainers">
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="gainers">Top Gainers</TabsTrigger>
            <TabsTrigger value="losers">Top Losers</TabsTrigger>
          </TabsList>
          <div className="flex">
            <button 
              className={`px-2 py-1 text-xs rounded ${period === '24h' ? 'bg-primary text-primary-foreground' : 'bg-neutral-700'}`}
              onClick={() => setPeriod('24h')}
            >
              24h
            </button>
            <button 
              className={`px-2 py-1 text-xs rounded ml-2 ${period === '7d' ? 'bg-primary text-primary-foreground' : 'bg-neutral-700'}`}
              onClick={() => setPeriod('7d')}
            >
              7d
            </button>
            <button 
              className={`px-2 py-1 text-xs rounded ml-2 ${period === '30d' ? 'bg-primary text-primary-foreground' : 'bg-neutral-700'}`}
              onClick={() => setPeriod('30d')}
            >
              30d
            </button>
          </div>
        </div>

        <TabsContent value="gainers">
          {topGainers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {topGainers.map((token) => (
                <Card 
                  key={token.id} 
                  className="bg-neutral-800 border-neutral-700 hover:border-neutral-600 transition-colors cursor-pointer"
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <img 
                          src={token.logoUrl || `https://via.placeholder.com/32/2563eb/ffffff?text=${token.symbol.charAt(0)}`} 
                          alt={token.name} 
                          className="w-8 h-8 rounded-full"
                        />
                        <div className="ml-2">
                          <h3 className="font-semibold text-sm">{token.symbol}</h3>
                          <p className="text-xs text-neutral-400">{token.name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatPrice(token.price)}</p>
                        <p className="text-xs text-green-400 flex items-center justify-end">
                          <TrendingUp className="w-3 h-3 mr-1" />
                          {formatPriceChange(token.priceChange24h || "0")}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-neutral-400">
              <p>No gainers data available at the moment.</p>
              <p className="text-sm mt-2">This could be due to API rate limiting. Try again later.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="losers">
          {topLosers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {topLosers.map((token) => (
                <Card 
                  key={token.id} 
                  className="bg-neutral-800 border-neutral-700 hover:border-neutral-600 transition-colors cursor-pointer"
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <img 
                          src={token.logoUrl || `https://via.placeholder.com/32/2563eb/ffffff?text=${token.symbol.charAt(0)}`} 
                          alt={token.name} 
                          className="w-8 h-8 rounded-full"
                        />
                        <div className="ml-2">
                          <h3 className="font-semibold text-sm">{token.symbol}</h3>
                          <p className="text-xs text-neutral-400">{token.name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatPrice(token.price)}</p>
                        <p className="text-xs text-red-400 flex items-center justify-end">
                          <TrendingDown className="w-3 h-3 mr-1" />
                          {formatPriceChange(token.priceChange24h || "0")}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-neutral-400">
              <p>No losers data available at the moment.</p>
              <p className="text-sm mt-2">This could be due to API rate limiting. Try again later.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MarketTrends;