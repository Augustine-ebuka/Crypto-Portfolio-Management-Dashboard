import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Plus } from "lucide-react";

interface AddAssetDialogProps {
  onAddAsset: (asset: {
    symbol: string;
    amount: number;
    purchasePrice: number;
  }) => void;
}

const POPULAR_CRYPTOS = [
  { symbol: 'BTC', name: 'Bitcoin', currentPrice: 67420 },
  { symbol: 'ETH', name: 'Ethereum', currentPrice: 3850 },
  { symbol: 'ADA', name: 'Cardano', currentPrice: 0.65 },
  { symbol: 'DOT', name: 'Polkadot', currentPrice: 8.45 },
  { symbol: 'LINK', name: 'Chainlink', currentPrice: 18.92 },
  { symbol: 'SOL', name: 'Solana', currentPrice: 145.32 },
  { symbol: 'MATIC', name: 'Polygon', currentPrice: 0.89 },
  { symbol: 'AVAX', name: 'Avalanche', currentPrice: 42.18 }
];

export function AddAssetDialog({ onAddAsset }: AddAssetDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedSymbol, setSelectedSymbol] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [purchasePrice, setPurchasePrice] = useState<string>("");

  const selectedCrypto = POPULAR_CRYPTOS.find(crypto => crypto.symbol === selectedSymbol);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedSymbol || !amount || !purchasePrice) {
      return;
    }

    onAddAsset({
      symbol: selectedSymbol,
      amount: parseFloat(amount),
      purchasePrice: parseFloat(purchasePrice),
    });

    // Reset form
    setSelectedSymbol("");
    setAmount("");
    setPurchasePrice("");
    setOpen(false);
  };

  const handleSymbolChange = (symbol: string) => {
    setSelectedSymbol(symbol);
    const crypto = POPULAR_CRYPTOS.find(c => c.symbol === symbol);
    if (crypto) {
      setPurchasePrice(crypto.currentPrice.toString());
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Asset
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Asset</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="symbol">Cryptocurrency</Label>
            <Select value={selectedSymbol} onValueChange={handleSymbolChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select a cryptocurrency" />
              </SelectTrigger>
              <SelectContent>
                {POPULAR_CRYPTOS.map((crypto) => (
                  <SelectItem key={crypto.symbol} value={crypto.symbol}>
                    <div className="flex items-center justify-between w-full">
                      <span>{crypto.symbol} - {crypto.name}</span>
                      <span className="text-muted-foreground ml-2">
                        ${crypto.currentPrice.toLocaleString()}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              step="any"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
            {selectedCrypto && (
              <p className="text-xs text-muted-foreground">
                How many {selectedCrypto.symbol} tokens you own
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="purchasePrice">Average Purchase Price (USD)</Label>
            <Input
              id="purchasePrice"
              type="number"
              step="any"
              placeholder="0.00"
              value={purchasePrice}
              onChange={(e) => setPurchasePrice(e.target.value)}
              required
            />
            {selectedCrypto && (
              <p className="text-xs text-muted-foreground">
                Current price: ${selectedCrypto.currentPrice.toLocaleString()}
              </p>
            )}
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Add Asset</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}