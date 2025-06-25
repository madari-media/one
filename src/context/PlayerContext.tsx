import React, { createContext, ReactNode, useContext, useState } from 'react';
import { QueueItem } from '@/components/MiniPlayer';

interface PlayerContextType {
  queue: QueueItem[];
  currentIndex: number;
  isPlayerVisible: boolean;
  addToQueue: (item: QueueItem) => void;
  playNow: (item: QueueItem) => void;
  addMultipleToQueue: (items: QueueItem[]) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
  setCurrentIndex: (index: number) => void;
  showPlayer: () => void;
  hidePlayer: () => void;
  setQueue: (queue: QueueItem[]) => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

interface PlayerProviderProps {
  children: ReactNode;
}

export const PlayerProvider: React.FC<PlayerProviderProps> = ({ children }) => {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlayerVisible, setIsPlayerVisible] = useState(false);

  const addToQueue = (item: QueueItem) => {
    setQueue(prev => {
      // Check if item already exists in queue
      const existingIndex = prev.findIndex(queueItem => queueItem.id === item.id);
      if (existingIndex !== -1) {
        return prev; // Don't add duplicates
      }
      return [...prev, item];
    });
    
    // Show player if it's not visible
    if (!isPlayerVisible) {
      setIsPlayerVisible(true);
    }
  };

  const playNow = (item: QueueItem) => {
    // Check if item is already in queue
    const existingIndex = queue.findIndex(queueItem => queueItem.id === item.id);
    
    if (existingIndex !== -1) {
      // Item exists, just play it
      setCurrentIndex(existingIndex);
    } else {
      // Add to queue and play immediately
      setQueue(prev => [item, ...prev]);
      setCurrentIndex(0);
    }
    
    setIsPlayerVisible(true);
  };

  const addMultipleToQueue = (items: QueueItem[]) => {
    setQueue(prev => {
      const newItems = items.filter(item => 
        !prev.some(queueItem => queueItem.id === item.id)
      );
      return [...prev, ...newItems];
    });
    
    if (!isPlayerVisible && items.length > 0) {
      setIsPlayerVisible(true);
    }
  };

  const removeFromQueue = (index: number) => {
    setQueue(prev => prev.filter((_, i) => i !== index));
    
    if (index < currentIndex) {
      setCurrentIndex(currentIndex - 1);
    } else if (index === currentIndex) {
      // If removing current item, stay at same index (next item will play)
      // Unless it's the last item, then go to previous
      if (index === queue.length - 1 && index > 0) {
        setCurrentIndex(index - 1);
      }
    }
    
    // Hide player if queue becomes empty
    if (queue.length <= 1) {
      setIsPlayerVisible(false);
    }
  };

  const clearQueue = () => {
    setQueue([]);
    setCurrentIndex(0);
    setIsPlayerVisible(false);
  };

  const showPlayer = () => setIsPlayerVisible(true);
  const hidePlayer = () => setIsPlayerVisible(false);

  const handleSetQueue = (newQueue: QueueItem[]) => {
    setQueue(newQueue);
    if (newQueue.length === 0) {
      setIsPlayerVisible(false);
      setCurrentIndex(0);
    }
  };

  const handleSetCurrentIndex = (index: number) => {
    if (index >= 0 && index < queue.length) {
      setCurrentIndex(index);
    }
  };

  const value: PlayerContextType = {
    queue,
    currentIndex,
    isPlayerVisible,
    addToQueue,
    playNow,
    addMultipleToQueue,
    removeFromQueue,
    clearQueue,
    setCurrentIndex: handleSetCurrentIndex,
    showPlayer,
    hidePlayer,
    setQueue: handleSetQueue,
  };

  return (
    <PlayerContext.Provider value={value}>
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
};