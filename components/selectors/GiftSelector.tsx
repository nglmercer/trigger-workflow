import React, { useState, useEffect, useRef, useCallback } from "react";
import { giftService, Gift } from "../../services/giftService";

interface GiftSelectorProps {
  value: string | number | null;
  onChange: (value: string | number | null, gift?: Gift) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  minCoins?: number;
  maxCoins?: number;
  autoFocus?: boolean;
  allowManualInput?: boolean;
}

const GiftSelector: React.FC<GiftSelectorProps> = ({
  value,
  onChange,
  placeholder = "Search gift or enter ID...",
  disabled = false,
  className = "",
  minCoins,
  maxCoins,
  autoFocus = false,
  allowManualInput = true,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [selectedGift, setSelectedGift] = useState<Gift | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [displayValue, setDisplayValue] = useState("");

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Fetch gifts when component mounts or search query changes
  const fetchGifts = useCallback(
    async (query: string = "") => {
      setIsLoading(true);
      setError(null);

      try {
        const results = await giftService.fetchGifts({
          query,
          minCoins,
          maxCoins,
          limit: 20,
        });
        setGifts(results);
      } catch (err) {
        setError("Failed to load gifts");
        console.error("Error fetching gifts:", err);
      } finally {
        setIsLoading(false);
      }
    },
    [minCoins, maxCoins],
  );

  // Initialize component
  useEffect(() => {
    // If we have a value, try to find the corresponding gift
    if (value !== null && value !== undefined && value !== "") {
      const findGift = async () => {
        const gift = await giftService.findGiftById(value);
        if (gift) {
          setSelectedGift(gift);
          setDisplayValue(`${gift.displayName || gift.name} (ID: ${gift.id})`);
        } else {
          setDisplayValue(String(value));
        }
      };
      findGift();
    }
  }, [value]);

  // Load initial gifts
  useEffect(() => {
    fetchGifts("");
  }, [fetchGifts]);

  // Handle search debouncing
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        fetchGifts(searchQuery);
      } else {
        fetchGifts("");
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, fetchGifts]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus input on mount if autoFocus is true
  useEffect(() => {
    if (autoFocus && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [autoFocus]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setDisplayValue(newValue);
    setSearchQuery(newValue);
    setIsOpen(true);

    // If manual input is allowed, update the value immediately
    if (allowManualInput) {
      onChange(newValue);
    }
  };

  const handleSelectGift = (gift: Gift) => {
    setSelectedGift(gift);
    setDisplayValue(`${gift.displayName || gift.name} (ID: ${gift.id})`);
    setSearchQuery("");
    setIsOpen(false);
    onChange(gift.id, gift);

    if (searchInputRef.current) {
      searchInputRef.current.blur();
    }
  };

  const handleClear = () => {
    setSelectedGift(null);
    setDisplayValue("");
    setSearchQuery("");
    setIsOpen(false);
    onChange(null);
  };

  const handleFocus = () => {
    if (!disabled) {
      setIsOpen(true);
    }
  };

  const formatCoins = (coins: number) => {
    if (coins >= 1000) {
      return `${(coins / 1000).toFixed(1)}K`;
    }
    return String(coins);
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <input
          ref={searchInputRef}
          type="text"
          value={displayValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          disabled={disabled}
          placeholder={placeholder}
          className={`
            w-full bg-slate-950/50 border border-slate-800 rounded-lg
            px-3 py-2 text-xs text-slate-300 outline-none
            focus:ring-1 focus:ring-purple-500/50 focus:border-purple-500/30
            transition-all
            ${disabled ? "opacity-50 cursor-not-allowed" : ""}
            ${selectedGift ? "text-purple-300" : ""}
          `}
        />

        {displayValue && !disabled && (
          <button
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        )}

        {!displayValue && !disabled && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none">
            <span className="material-symbols-outlined text-sm">search</span>
          </div>
        )}
      </div>

      {isOpen && !disabled && (
        <div
          className={`
          absolute z-50 w-full mt-1 bg-slate-950/95 backdrop-blur-xl
          border border-slate-800 rounded-lg shadow-2xl max-h-64 overflow-hidden
          ring-1 ring-white/5
          transition-all
        `}
        >
          {/* Loading State */}
          {isLoading && gifts.length === 0 && (
            <div className="px-3 py-8 text-center text-slate-500 text-xs">
              <div className="flex items-center justify-center gap-2">
                <div className="size-4 border-2 border-slate-700 border-t-purple-500 rounded-full animate-spin" />
                <span>Loading gifts...</span>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="px-3 py-4 text-center text-red-400 text-xs">
              <span className="material-symbols-outlined text-sm">error</span>
              <span className="ml-1">{error}</span>
            </div>
          )}

          {/* No Results */}
          {!isLoading && !error && gifts.length === 0 && searchQuery && (
            <div className="px-3 py-4 text-center text-slate-500 text-xs">
              <span className="material-symbols-outlined text-sm">gift</span>
              <span className="ml-1">No gifts found for "{searchQuery}"</span>
              {allowManualInput && (
                <div className="mt-2 text-slate-600 text-[10px]">
                  Press Enter to use this value: {searchQuery}
                </div>
              )}
            </div>
          )}

          {/* Gift List */}
          {!isLoading && !error && (
            <div className="max-h-64 overflow-y-auto custom-scrollbar">
              {gifts.length > 0 && (
                <div className="py-1">
                  {gifts.map((gift) => (
                    <button
                      key={gift.id}
                      onClick={() => handleSelectGift(gift)}
                      className={`
                        w-full px-3 py-2 flex items-center gap-2 text-left
                        hover:bg-purple-500/10 transition-colors border border-transparent
                        ${selectedGift?.id === gift.id ? "bg-purple-500/20 border-purple-500/30" : ""}
                      `}
                    >
                      {/* Gift Icon */}
                      {gift.iconUrl ? (
                        <img
                          src={gift.iconUrl}
                          alt={gift.name}
                          className="w-6 h-6 rounded object-cover"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                          <span className="material-symbols-outlined text-xs text-purple-400">
                            card_giftcard
                          </span>
                        </div>
                      )}

                      {/* Gift Info */}
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-slate-300 font-medium truncate">
                          {gift.displayName || gift.name}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          ID: {gift.id}
                        </div>
                      </div>

                      {/* Coin Value */}
                      <div className="flex items-center gap-1 text-yellow-500">
                        <span className="material-symbols-outlined text-xs">
                          diamond
                        </span>
                        <span className="text-xs font-medium">
                          {formatCoins(gift.coins)}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Manual Input Hint */}
              {allowManualInput && searchQuery && (
                <div className="px-3 py-2 border-t border-slate-800 bg-slate-900/50">
                  <button
                    onClick={() => {
                      onChange(searchQuery);
                      setIsOpen(false);
                      if (searchInputRef.current) {
                        searchInputRef.current.blur();
                      }
                    }}
                    className="w-full text-left text-[10px] text-slate-400 hover:text-purple-400 transition-colors"
                  >
                    <span className="material-symbols-outlined text-xs align-middle mr-1">
                      edit
                    </span>
                    Use as custom value: "{searchQuery}"
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Selected Gift Badge */}
      {selectedGift && !isOpen && (
        <div className="absolute -bottom-5 left-0 text-[9px] text-slate-500">
          {selectedGift.coins} coins • {selectedGift.type || "gift"}
        </div>
      )}
    </div>
  );
};

export default GiftSelector;
