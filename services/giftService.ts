// agnostic-trigger-workflow-builder/services/giftService.ts

export interface Gift {
  id: string | number;
  name: string;
  displayName?: string;
  coins: number;
  iconUrl?: string;
  imageUrl?: string;
  description?: string;
  type?: 'sticker' | 'gift' | 'special';
}

export interface GiftFetchOptions {
  query?: string;
  minCoins?: number;
  maxCoins?: number;
  limit?: number;
}

class GiftService {
  private giftsCache: Gift[] | null = null;
  private lastFetch: number = 0;
  private cacheTimeout: number = 5 * 60 * 1000; // 5 minutes

  /**
   * Fetch all available gifts (with caching)
   */
  async fetchAllGifts(): Promise<Gift[]> {
    const now = Date.now();

    // Return cached data if still valid
    if (this.giftsCache && (now - this.lastFetch) < this.cacheTimeout) {
      return this.giftsCache;
    }

    try {
      // In a real implementation, this would call your API
      // const response = await fetch('https://api.example.com/gifts');
      // const data = await response.json();
      // return data;

      // Mock data for demonstration
      const mockGifts: Gift[] = [
        { id: 1, name: 'Rose', displayName: '🌹 Rose', coins: 1, iconUrl: '', type: 'gift' },
        { id: 2, name: 'TikTok', displayName: 'TikTok Logo', coins: 1, iconUrl: '', type: 'gift' },
        { id: 3, name: 'GG', displayName: 'GG', coins: 5, iconUrl: '', type: 'gift' },
        { id: 4, name: 'Handshake', displayName: '🤝 Handshake', coins: 5, iconUrl: '', type: 'gift' },
        { id: 5, name: 'Panda', displayName: '🐼 Panda', coins: 5, iconUrl: '', type: 'gift' },
        { id: 6, name: 'Heart', displayName: '❤️ Heart', coins: 10, iconUrl: '', type: 'gift' },
        { id: 7, name: 'Drip', displayName: '💧 Drip', coins: 10, iconUrl: '', type: 'gift' },
        { id: 8, name: 'Doughnut', displayName: '🍩 Doughnut', coins: 30, iconUrl: '', type: 'gift' },
        { id: 9, name: 'Applause', displayName: '👏 Applause', coins: 30, iconUrl: '', type: 'gift' },
        { id: 10, name: 'Megan', displayName: 'Megan', coins: 50, iconUrl: '', type: 'gift' },
        { id: 11, name: 'GG Bang', displayName: 'GG Bang', coins: 100, iconUrl: '', type: 'gift' },
        { id: 12, name: 'Drama Queen', displayName: '🎭 Drama Queen', coins: 100, iconUrl: '', type: 'gift' },
        { id: 13, name: 'Confetti', displayName: '🎊 Confetti', coins: 100, iconUrl: '', type: 'gift' },
        { id: 14, name: 'Periscope', displayName: '🔭 Periscope', coins: 100, iconUrl: '', type: 'gift' },
        { id: 15, name: 'Money Gun', displayName: '💸 Money Gun', coins: 300, iconUrl: '', type: 'gift' },
        { id: 16, name: 'Galaxy', displayName: '🌌 Galaxy', coins: 500, iconUrl: '', type: 'gift' },
        { id: 17, name: 'Yacht', displayName: '🛥️ Yacht', coins: 1000, iconUrl: '', type: 'gift' },
        { id: 18, name: 'Train', displayName: '🚂 Train', coins: 2888, iconUrl: '', type: 'gift' },
        { id: 19, name: 'Jet', displayName: '✈️ Jet', coins: 3500, iconUrl: '', type: 'gift' },
        { id: 20, name: 'TikTok Universe', displayName: '🌟 TikTok Universe', coins: 34999, iconUrl: '', type: 'gift' },
        { id: 21, name: 'Monster', displayName: '👹 Monster', coins: 50000, iconUrl: '', type: 'gift' },
        { id: 22, name: 'Lion', displayName: '🦁 Lion', coins: 29999, iconUrl: '', type: 'gift' },
        { id: 23, name: 'Ferrari', displayName: '🏎️ Ferrari', coins: 100000, iconUrl: '', type: 'gift' },
      ];

      this.giftsCache = mockGifts;
      this.lastFetch = now;

      return mockGifts;
    } catch (error) {
      console.error('Error fetching gifts:', error);
      return [];
    }
  }

  /**
   * Fetch gifts with filtering options
   */
  async fetchGifts(options: GiftFetchOptions = {}): Promise<Gift[]> {
    const allGifts = await this.fetchAllGifts();

    return allGifts.filter(gift => {
      if (options.query) {
        const queryLower = options.query.toLowerCase();
        const matchesName = gift.name.toLowerCase().includes(queryLower);
        const matchesDisplayName = gift.displayName?.toLowerCase().includes(queryLower);
        const matchesId = String(gift.id).includes(queryLower);

        if (!matchesName && !matchesDisplayName && !matchesId) {
          return false;
        }
      }

      if (options.minCoins !== undefined && gift.coins < options.minCoins) {
        return false;
      }

      if (options.maxCoins !== undefined && gift.coins > options.maxCoins) {
        return false;
      }

      return true;
    }).slice(0, options.limit || 50);
  }

  /**
   * Find a specific gift by ID
   */
  async findGiftById(id: string | number): Promise<Gift | null> {
    const allGifts = await this.fetchAllGifts();
    return allGifts.find(gift => String(gift.id) === String(id)) || null;
  }

  /**
   * Search for gifts by name or ID
   */
  async searchGifts(query: string, limit: number = 10): Promise<Gift[]> {
    return this.fetchGifts({ query, limit });
  }

  /**
   * Get gifts by coin range
   */
  async getGiftsByCoinRange(minCoins: number, maxCoins: number): Promise<Gift[]> {
    return this.fetchGifts({ minCoins, maxCoins });
  }

  /**
   * Clear the cache (useful for testing or force refresh)
   */
  clearCache(): void {
    this.giftsCache = null;
    this.lastFetch = 0;
  }

  /**
   * Check if a field path is gift-related
   */
  isGiftRelatedField(field: string): boolean {
    const lowerField = field.toLowerCase();
    return lowerField.includes('gift') ||
           lowerField.includes('data.gift') ||
           lowerField.includes('.gift.') ||
           lowerField === 'gift' ||
           lowerField.endsWith('.gift');
  }

  /**
   * Extract the gift reference from a field path
   * e.g., "data.gift.id" -> "id", "data.gift.name" -> "name", "data.coins" -> null
   */
  extractGiftProperty(field: string): string | null {
    const giftMatch = field.match(/(?:^|\.)(gift(?:\.(.+))?)$/i);
    if (giftMatch) {
      return giftMatch[2] || 'id';
    }
    return null;
  }
}

// Export singleton instance
export const giftService = new GiftService();
