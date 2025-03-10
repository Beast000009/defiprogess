import { useQuery } from "@tanstack/react-query";
import { fetchTokenPrices, TokenPrice, formatPriceChange } from "@/lib/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const MarketTrends = () => {
  const { data: tokenPrices, isLoading, error } = useQuery({
    queryKey: ['/api/prices'],
    refetchInterval: 60000 // Refresh every minute
  });

  if (isLoading) {
    return (
      <Card className="bg-neutral-800 rounded-xl border border-neutral-700 p-4">
        <CardHeader className="px-0 pt-0">
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-6 w-32" />
            <div className="flex space-x-1">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-6 w-24" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Skeleton className="w-full h-60" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-neutral-800 rounded-xl border border-red-800 p-4 text-red-400">
        <CardContent>
          <p>Error loading market data. Please try again later.</p>
        </CardContent>
      </Card>
    );
  }

  // Sort tokens by price change
  const sortedTokens = [...(tokenPrices || [])];
  const gainers = sortedTokens
    .filter((token: TokenPrice) => parseFloat(token.priceChange24h) > 0)
    .sort((a: TokenPrice, b: TokenPrice) => parseFloat(b.priceChange24h) - parseFloat(a.priceChange24h));
  
  const losers = sortedTokens
    .filter((token: TokenPrice) => parseFloat(token.priceChange24h) < 0)
    .sort((a: TokenPrice, b: TokenPrice) => parseFloat(a.priceChange24h) - parseFloat(b.priceChange24h));

  return (
    <Card className="bg-neutral-800 rounded-xl border border-neutral-700 p-4">
      <CardHeader className="px-0 pt-0">
        <div className="flex items-center justify-between mb-4">
          <CardTitle className="text-lg">Market Trends</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs defaultValue="gainers">
          <div className="flex justify-end mb-4">
            <TabsList className="bg-neutral-700">
              <TabsTrigger value="gainers" className="text-xs px-2.5 py-1">
                Top Gainers
              </TabsTrigger>
              <TabsTrigger value="losers" className="text-xs px-2.5 py-1">
                Top Losers
              </TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="gainers" className="mt-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-neutral-400 border-b border-neutral-700">
                    <th className="pb-2 font-medium">Asset</th>
                    <th className="pb-2 font-medium text-right">Price</th>
                    <th className="pb-2 font-medium text-right">24h Change</th>
                  </tr>
                </thead>
                <tbody>
                  {gainers.slice(0, 4).map((token: TokenPrice) => (
                    <tr key={token.id} className="border-b border-neutral-700">
                      <td className="py-3">
                        <div className="flex items-center">
                          <div className="w-6 h-6 rounded-full bg-neutral-600 flex items-center justify-center overflow-hidden mr-2">
                            <img src={token.logoUrl} alt={token.symbol} className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-medium">{token.name}</div>
                            <div className="text-xs text-neutral-400">{token.symbol}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 text-right font-mono">
                        ${parseFloat(token.price).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 6
                        })}
                      </td>
                      <td className="py-3 text-right text-success">
                        {formatPriceChange(token.priceChange24h)}
                      </td>
                    </tr>
                  ))}
                  {gainers.length === 0 && (
                    <tr>
                      <td colSpan={3} className="py-3 text-center text-neutral-400">
                        No gainers found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </TabsContent>
          
          <TabsContent value="losers" className="mt-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-neutral-400 border-b border-neutral-700">
                    <th className="pb-2 font-medium">Asset</th>
                    <th className="pb-2 font-medium text-right">Price</th>
                    <th className="pb-2 font-medium text-right">24h Change</th>
                  </tr>
                </thead>
                <tbody>
                  {losers.slice(0, 4).map((token: TokenPrice) => (
                    <tr key={token.id} className="border-b border-neutral-700">
                      <td className="py-3">
                        <div className="flex items-center">
                          <div className="w-6 h-6 rounded-full bg-neutral-600 flex items-center justify-center overflow-hidden mr-2">
                            <img src={token.logoUrl} alt={token.symbol} className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-medium">{token.name}</div>
                            <div className="text-xs text-neutral-400">{token.symbol}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 text-right font-mono">
                        ${parseFloat(token.price).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 6
                        })}
                      </td>
                      <td className="py-3 text-right text-error">
                        {formatPriceChange(token.priceChange24h)}
                      </td>
                    </tr>
                  ))}
                  {losers.length === 0 && (
                    <tr>
                      <td colSpan={3} className="py-3 text-center text-neutral-400">
                        No losers found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default MarketTrends;
