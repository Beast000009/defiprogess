import { useQuery } from "@tanstack/react-query";
import { fetchTokenPrices, TokenPrice, formatPriceChange, formatUsdValue } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCw, TrendingUp, Info, ChevronUp, ChevronDown, Search, X } from "lucide-react";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";

const PriceOverview = () => {
  const [sortBy, setSortBy] = useState<string>("market_cap");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedToken, setSelectedToken] = useState<TokenPrice | null>(null);
  
  const { data: tokenPrices, isLoading, error, refetch } = useQuery<TokenPrice[]>({
    queryKey: ['/api/prices'],
    refetchInterval: 60000 // Refresh every minute
  });

  // Function to filter tokens based on search query
  const filterTokens = (tokens: TokenPrice[] | undefined) => {
    if (!tokens || tokens.length === 0) return [];
    
    if (!searchQuery) return tokens;
    
    const query = searchQuery.toLowerCase();
    return tokens.filter(token => 
      token.name.toLowerCase().includes(query) || 
      token.symbol.toLowerCase().includes(query)
    );
  };

  // Function to sort token prices
  const sortTokenPrices = (tokens: TokenPrice[] | undefined) => {
    if (!tokens || tokens.length === 0) return [];
    
    const filteredTokens = filterTokens(tokens);

    return [...filteredTokens].sort((a, b) => {
      let valueA, valueB;

      switch (sortBy) {
        case "price":
          valueA = parseFloat(a.price || "0");
          valueB = parseFloat(b.price || "0");
          break;
        case "change":
          valueA = parseFloat(a.priceChange24h || "0");
          valueB = parseFloat(b.priceChange24h || "0");
          break;
        case "volume":
          valueA = parseFloat(a.volume24h || "0");
          valueB = parseFloat(b.volume24h || "0");
          break;
        case "market_cap":
        default:
          valueA = parseFloat(a.marketCap || "0");
          valueB = parseFloat(b.marketCap || "0");
          break;
      }

      return sortOrder === "asc" ? valueA - valueB : valueB - valueA;
    });
  };
  
  // Handle token selection
  const handleTokenSelect = (token: TokenPrice) => {
    setSelectedToken(token);
    // You can pass the selected token to PriceChart here
  };

  // Handler for refreshing data
  const handleRefresh = () => {
    refetch();
  };

  // Handler for changing sort
  const handleSortChange = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("desc");
    }
  };

  if (isLoading) {
    return (
      <div className="relative bg-neutral-800 rounded-xl p-4 mb-8">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-9 w-28" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="text-left text-neutral-400 border-b border-neutral-700">
                <th className="pb-2 font-medium">Token</th>
                <th className="pb-2 font-medium text-right">Price</th>
                <th className="pb-2 font-medium text-right">24h Change</th>
                <th className="pb-2 font-medium text-right">24h Volume</th>
                <th className="pb-2 font-medium text-right">Market Cap</th>
              </tr>
            </thead>
            <tbody>
              {Array(6).fill(0).map((_, index) => (
                <tr key={index} className="border-b border-neutral-700">
                  <td className="py-3">
                    <div className="flex items-center">
                      <Skeleton className="w-8 h-8 rounded-full mr-2" />
                      <div>
                        <Skeleton className="h-5 w-24 mb-1" />
                        <Skeleton className="h-3 w-10" />
                      </div>
                    </div>
                  </td>
                  <td className="py-3 text-right"><Skeleton className="h-5 w-24 ml-auto" /></td>
                  <td className="py-3 text-right"><Skeleton className="h-5 w-16 ml-auto" /></td>
                  <td className="py-3 text-right"><Skeleton className="h-5 w-28 ml-auto" /></td>
                  <td className="py-3 text-right"><Skeleton className="h-5 w-28 ml-auto" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-neutral-800 rounded-xl border border-red-800 text-red-400 mb-8">
        <p>Error loading price data. Please try again later.</p>
      </div>
    );
  }

  const sortedTokens = sortTokenPrices(tokenPrices);

  return (
    <div className="relative bg-neutral-800 rounded-xl p-4 mb-8">
      <div className="flex flex-col sm:flex-row justify-between mb-4 gap-3">
        <h2 className="text-xl font-semibold">Live Market Data</h2>
        <div className="flex items-center space-x-3">
          <Tabs defaultValue="table" className="w-[200px]">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="table">Table</TabsTrigger>
              <TabsTrigger value="cards">Cards</TabsTrigger>
            </TabsList>
            
            <TabsContent value="table">
              <div className="overflow-x-auto mt-4">
                <table className="w-full min-w-[700px]">
                  <thead>
                    <tr className="text-left text-neutral-400 border-b border-neutral-700">
                      <th className="pb-2 font-medium">Token</th>
                      <th 
                        className="pb-2 font-medium text-right cursor-pointer hover:text-white"
                        onClick={() => handleSortChange("price")}
                      >
                        <div className="flex items-center justify-end">
                          Price
                          {sortBy === "price" && (
                            sortOrder === "asc" ? <ChevronUp className="ml-1 w-4 h-4" /> : <ChevronDown className="ml-1 w-4 h-4" />
                          )}
                        </div>
                      </th>
                      <th 
                        className="pb-2 font-medium text-right cursor-pointer hover:text-white"
                        onClick={() => handleSortChange("change")}
                      >
                        <div className="flex items-center justify-end">
                          24h Change
                          {sortBy === "change" && (
                            sortOrder === "asc" ? <ChevronUp className="ml-1 w-4 h-4" /> : <ChevronDown className="ml-1 w-4 h-4" />
                          )}
                        </div>
                      </th>
                      <th 
                        className="pb-2 font-medium text-right cursor-pointer hover:text-white"
                        onClick={() => handleSortChange("volume")}
                      >
                        <div className="flex items-center justify-end">
                          24h Volume
                          {sortBy === "volume" && (
                            sortOrder === "asc" ? <ChevronUp className="ml-1 w-4 h-4" /> : <ChevronDown className="ml-1 w-4 h-4" />
                          )}
                        </div>
                      </th>
                      <th 
                        className="pb-2 font-medium text-right cursor-pointer hover:text-white"
                        onClick={() => handleSortChange("market_cap")}
                      >
                        <div className="flex items-center justify-end">
                          Market Cap
                          {sortBy === "market_cap" && (
                            sortOrder === "asc" ? <ChevronUp className="ml-1 w-4 h-4" /> : <ChevronDown className="ml-1 w-4 h-4" />
                          )}
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedTokens.map((token: TokenPrice) => (
                      <tr key={token.id} className="border-b border-neutral-700 hover:bg-neutral-700/30 transition-colors">
                        <td className="py-3">
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-neutral-700 flex items-center justify-center overflow-hidden mr-2">
                              <img src={token.logoUrl} alt={token.symbol} className="w-5 h-5" />
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
                        <td className={`py-3 text-right ${parseFloat(token.priceChange24h) >= 0 ? 'text-success' : 'text-error'}`}>
                          {formatPriceChange(token.priceChange24h)}
                        </td>
                        <td className="py-3 text-right">
                          {formatUsdValue(token.volume24h || "0")}
                        </td>
                        <td className="py-3 text-right">
                          {formatUsdValue(token.marketCap || "0")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>
            
            <TabsContent value="cards">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                {sortedTokens.slice(0, 8).map((token: TokenPrice) => (
                  <div key={token.id} className="bg-neutral-700 rounded-xl p-4 hover:border-primary-light border border-transparent transition-all">
                    <div className="flex items-center mb-3">
                      <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center overflow-hidden mr-2">
                        <img src={token.logoUrl} alt={token.symbol} className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium">{token.name}</h3>
                          <span className="text-xs text-neutral-300">{token.symbol}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-end justify-between">
                      <div className="font-mono font-medium text-xl">
                        ${parseFloat(token.price).toLocaleString(undefined, { 
                          minimumFractionDigits: 2, 
                          maximumFractionDigits: 6 
                        })}
                      </div>
                      <div className={`flex items-center text-sm ${parseFloat(token.priceChange24h) >= 0 ? 'text-success' : 'text-error'}`}>
                        {parseFloat(token.priceChange24h) >= 0 ? 
                          <ChevronUp className="mr-1 w-4 h-4" /> : 
                          <ChevronDown className="mr-1 w-4 h-4" />
                        }
                        <span>{formatPriceChange(token.priceChange24h)}</span>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-neutral-600 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-neutral-400">24h Vol:</span>
                        <div className="font-medium">{formatUsdValue(token.volume24h || "0")}</div>
                      </div>
                      <div>
                        <span className="text-neutral-400">Market Cap:</span>
                        <div className="font-medium">{formatUsdValue(token.marketCap || "0")}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button 
                  className="p-2 bg-neutral-700 rounded-md hover:bg-neutral-600 transition-colors"
                  onClick={handleRefresh}
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Refresh market data</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="p-2 bg-neutral-700 rounded-md hover:bg-neutral-600 transition-colors cursor-help">
                  <Info className="w-5 h-5" />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Data sourced from CoinGecko API</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      
      <div className="text-xs text-neutral-400 text-right mt-2">
        Last updated: {new Date().toLocaleTimeString()}
      </div>
    </div>
  );
};

export default PriceOverview;
