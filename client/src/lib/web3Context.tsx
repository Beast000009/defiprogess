import { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { ethers } from 'ethers';
import { useToast } from '@/hooks/use-toast';

// Define window ethereum type
declare global {
  interface Window {
    ethereum?: any;
  }
}

// Context type definition
interface Web3ContextType {
  provider: ethers.BrowserProvider | null;
  signer: ethers.JsonRpcSigner | null;
  address: string | null;
  chainId: number | null;
  isConnected: boolean;
  isConnecting: boolean;
  connectWallet: (providerType?: string) => Promise<void>;
  disconnectWallet: () => void;
}

// Create context with default values
const Web3Context = createContext<Web3ContextType>({
  provider: null,
  signer: null,
  address: null,
  chainId: null,
  isConnected: false,
  isConnecting: false,
  connectWallet: async () => {},
  disconnectWallet: () => {},
});

// Provider props interface
interface Web3ProviderProps {
  children: ReactNode;
}

// Provider component
export function Web3Provider({ children }: Web3ProviderProps) {
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();

  const connectWallet = async (providerType = 'metamask') => {
    if (!window.ethereum) {
      toast({
        title: "Wallet Error",
        description: "No Ethereum wallet found. Please install MetaMask or another wallet.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsConnecting(true);

      // Request account access
      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      await browserProvider.send("eth_requestAccounts", []);
      
      // Get signer and address
      const ethSigner = await browserProvider.getSigner();
      const signerAddress = await ethSigner.getAddress();
      const network = await browserProvider.getNetwork();
      
      setProvider(browserProvider);
      setSigner(ethSigner);
      setAddress(signerAddress);
      setChainId(Number(network.chainId));
      setIsConnected(true);
      
      // Store the address in localStorage for persistence
      localStorage.setItem('walletAddress', signerAddress);
      
      toast({
        title: "Wallet Connected",
        description: `Connected to ${signerAddress.substring(0, 6)}...${signerAddress.substring(signerAddress.length - 4)}`,
      });
    } catch (error) {
      console.error("Error connecting wallet:", error);
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "Failed to connect wallet",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setProvider(null);
    setSigner(null);
    setAddress(null);
    setChainId(null);
    setIsConnected(false);
    localStorage.removeItem('walletAddress');
    
    toast({
      title: "Wallet Disconnected",
      description: "Your wallet has been disconnected",
    });
  };

  // Check for saved wallet address on mount
  useEffect(() => {
    const savedAddress = localStorage.getItem('walletAddress');
    if (savedAddress && window.ethereum) {
      connectWallet();
    }
  }, []);

  // Set up event listeners for wallet changes
  useEffect(() => {
    if (window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          disconnectWallet();
        } else if (accounts[0] !== address) {
          setAddress(accounts[0]);
          localStorage.setItem('walletAddress', accounts[0]);
        }
      };

      const handleChainChanged = (chainIdHex: string) => {
        setChainId(parseInt(chainIdHex, 16));
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, [address]);

  return (
    <Web3Context.Provider 
      value={{
        provider,
        signer,
        address,
        chainId,
        isConnected,
        isConnecting,
        connectWallet,
        disconnectWallet
      }}
    >
      {children}
    </Web3Context.Provider>
  );
}

// Custom hook to use the Web3 context
export const useWeb3 = () => useContext(Web3Context);