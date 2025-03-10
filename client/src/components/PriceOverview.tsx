import { useQuery } from "@tanstack/react-query";
import { fetchTokenPrices, TokenPrice, formatPriceChange } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";

const PriceOverview = () => {
  const { data: tokenPrices, isLoading, error } = useQuery({
    queryKey: ['/api/prices'],
    refetchInterval: 60000 // Refresh every minute
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array(4).fill(0).map((_, index) => (
          <div key={index} className="bg-neutral-800 rounded-xl p-4">
            <div className="flex items-center mb-3">
              <Skeleton className="w-8 h-8 rounded-full mr-2" />
              <div className="flex-1">
                <Skeleton className="h-5 w-24" />
              </div>
            </div>
            <div className="flex items-end justify-between">
              <Skeleton className="h-6 w-28" />
              <Skeleton className="h-5 w-16" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-neutral-800 rounded-xl border border-red-800 text-red-400">
        <p>Error loading price data. Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {tokenPrices && tokenPrices.slice(0, 4).map((token: TokenPrice) => (
        <div key={token.id} className="bg-neutral-800 rounded-xl p-4 hover:border-primary-light border border-transparent transition-all">
          <div className="flex items-center mb-3">
            <div className="w-8 h-8 rounded-full bg-neutral-700 flex items-center justify-center overflow-hidden mr-2">
              <img src={token.logoUrl} alt={token.symbol} className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">{token.name}</h3>
                <span className="text-xs text-neutral-400">{token.symbol}</span>
              </div>
            </div>
          </div>
          <div className="flex items-end justify-between">
            <div className="font-mono font-medium text-xl">
              ${parseFloat(token.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
            </div>
            <div className={`flex items-center text-sm ${parseFloat(token.priceChange24h) >= 0 ? 'text-success' : 'text-error'}`}>
              <i className={`${parseFloat(token.priceChange24h) >= 0 ? 'ri-arrow-up-line' : 'ri-arrow-down-line'} mr-1`}></i>
              <span>{formatPriceChange(token.priceChange24h)}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PriceOverview;
