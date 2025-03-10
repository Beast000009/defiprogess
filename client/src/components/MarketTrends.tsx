import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader } from './ui/card';
import { Skeleton } from './ui/skeleton';
import { formatCurrency, formatPriceChange } from '@/lib/api';

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

  // Sort tokens by market cap
  const sortedTokens = [...tokenPrices].sort((a, b) => 
    parseFloat(b.marketCap || '0') - parseFloat(a.marketCap || '0')
  ).slice(0, 5); // Get top 5 by market cap

  return (
    <Card className="bg-neutral-800 rounded-xl border border-neutral-700 p-4">
      <CardHeader className="px-0 pt-0">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Market Trends</h2>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="mt-2">
          <div className="grid gap-3">
            {sortedTokens.map((token) => (
              <div key={token.id} className="flex items-center justify-between p-3 rounded-lg bg-neutral-900 hover:bg-neutral-850 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full overflow-hidden">
                    <img src={token.logoUrl} alt={token.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <div className="font-medium">{token.name}</div>
                    <div className="text-sm text-neutral-400">{token.symbol}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">{formatCurrency(parseFloat(token.price))}</div>
                  <div className={`text-sm ${parseFloat(token.priceChange24h) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {formatPriceChange(parseFloat(token.priceChange24h))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MarketTrends;