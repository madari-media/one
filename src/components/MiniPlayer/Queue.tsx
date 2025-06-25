import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { GripVertical, X } from 'lucide-react';
import { QueueItem } from './types';

interface ItemDetails {
  poster?: string;
  subtitle?: string;
}

const QueueItemInfo: React.FC<{ item: QueueItem }> = ({ item }) => {
  const [itemDetails, setItemDetails] = useState<ItemDetails>({});

  useEffect(() => {
    const fetchItemDetails = async () => {
      if (!item?.jellyfinItemId) return;

      try {
        const baseUrl = localStorage.getItem('jellyfin_server_url');
        const apiKey = localStorage.getItem('jellyfin_api_key');
        const userId = localStorage.getItem('jellyfin_user_id');

        if (!baseUrl || !apiKey || !userId) return;

        const response = await fetch(
          `${baseUrl}/Items/${item.jellyfinItemId}?api_key=${apiKey}&UserId=${userId}`
        );
        
        if (response.ok) {
          const data = await response.json();
          setItemDetails({
            poster: data.ImageTags?.Primary 
              ? `${baseUrl}/Items/${item.jellyfinItemId}/Images/Primary?api_key=${apiKey}`
              : undefined,
            subtitle: data.Type === 'Episode' 
              ? `S${data.ParentIndexNumber}E${data.IndexNumber}`
              : undefined
          });
        }
      } catch (error) {
        console.error('Error fetching item details:', error);
      }
    };

    fetchItemDetails();
  }, [item?.jellyfinItemId]);

  return (
    <>
      {/* Poster */}
      {itemDetails.poster && (
        <img
          src={itemDetails.poster}
          alt={item.title}
          className="w-10 h-10 rounded object-cover flex-shrink-0"
        />
      )}

      {/* Item Info */}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{item.title}</div>
        {itemDetails.subtitle && (
          <div className="text-xs opacity-70 truncate">{itemDetails.subtitle}</div>
        )}
      </div>
    </>
  );
};

interface QueueProps {
  queue: QueueItem[];
  currentIndex: number;
  isVisible: boolean;
  onClose: () => void;
  onQueueChange: (queue: QueueItem[]) => void;
  onCurrentIndexChange: (index: number) => void;
}

export const Queue: React.FC<QueueProps> = ({
  queue,
  currentIndex,
  isVisible,
  onClose,
  onQueueChange,
  onCurrentIndexChange,
}) => {
  const [dragState, setDragState] = useState({
    isDragging: false,
    draggedIndex: -1,
    dragOverIndex: -1,
  });

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    setDragState({
      isDragging: true,
      draggedIndex: index,
      dragOverIndex: -1,
    });
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', index.toString());
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    if (dragState.draggedIndex !== index) {
      setDragState(prev => ({
        ...prev,
        dragOverIndex: index,
      }));
    }
  };

  const handleDragLeave = () => {
    setDragState(prev => ({
      ...prev,
      dragOverIndex: -1,
    }));
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, dropIndex: number) => {
    e.preventDefault();
    
    const draggedIndex = dragState.draggedIndex;
    if (draggedIndex === dropIndex || draggedIndex === -1) {
      setDragState({
        isDragging: false,
        draggedIndex: -1,
        dragOverIndex: -1,
      });
      return;
    }

    // Create new queue with reordered items
    const newQueue = [...queue];
    const draggedItem = newQueue[draggedIndex];
    
    // Remove dragged item
    newQueue.splice(draggedIndex, 1);
    
    // Insert at new position
    const adjustedDropIndex = draggedIndex < dropIndex ? dropIndex - 1 : dropIndex;
    newQueue.splice(adjustedDropIndex, 0, draggedItem);

    // Update current index if needed
    let newCurrentIndex = currentIndex;
    if (draggedIndex === currentIndex) {
      // Currently playing item was moved
      newCurrentIndex = adjustedDropIndex;
    } else if (draggedIndex < currentIndex && adjustedDropIndex >= currentIndex) {
      // Item moved from before current to after current
      newCurrentIndex = currentIndex - 1;
    } else if (draggedIndex > currentIndex && adjustedDropIndex <= currentIndex) {
      // Item moved from after current to before current
      newCurrentIndex = currentIndex + 1;
    }

    onQueueChange(newQueue);
    if (newCurrentIndex !== currentIndex) {
      onCurrentIndexChange(newCurrentIndex);
    }

    setDragState({
      isDragging: false,
      draggedIndex: -1,
      dragOverIndex: -1,
    });
  };

  const handleDragEnd = () => {
    setDragState({
      isDragging: false,
      draggedIndex: -1,
      dragOverIndex: -1,
    });
  };

  const removeFromQueue = (index: number) => {
    const newQueue = queue.filter((_, i) => i !== index);
    onQueueChange(newQueue);

    if (index < currentIndex) {
      onCurrentIndexChange(currentIndex - 1);
    } else if (index === currentIndex && index === newQueue.length) {
      onCurrentIndexChange(Math.max(0, newQueue.length - 1));
    }
  };

  if (!isVisible) return null;

  return (
    <div className="absolute bottom-full right-0 w-80 bg-zinc-800 border-l border-zinc-700 max-h-96 overflow-y-auto">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold">Queue ({queue.length})</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="space-y-2">
          {queue.map((item, index) => (
            <div
              key={`${item.jellyfinItemId}-${index}`}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              className={`group flex items-center gap-3 p-2 rounded cursor-pointer transition-all relative ${
                index === currentIndex
                  ? 'bg-blue-600 text-white'
                  : 'hover:bg-zinc-700 text-zinc-300'
              } ${
                dragState.dragOverIndex === index && dragState.draggedIndex !== index
                  ? 'border-t-2 border-red-500'
                  : ''
              } ${
                dragState.draggedIndex === index
                  ? 'opacity-50 scale-95'
                  : ''
              }`}
              onClick={() => onCurrentIndexChange(index)}
            >
              {/* Drag Handle */}
              <div className="opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
                <GripVertical className="w-4 h-4 text-zinc-500" />
              </div>

              <QueueItemInfo item={item} />

              {/* Remove Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFromQueue(index);
                }}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-600/20 hover:text-red-400"
                title="Remove from queue"
              >
                <X className="w-3 h-3" />
              </Button>

              {/* Drop Indicator */}
              {dragState.dragOverIndex === index && dragState.draggedIndex !== index && (
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-red-500" />
              )}
            </div>
          ))}

          {queue.length === 0 && (
            <div className="text-zinc-400 text-center py-8">
              <p>Queue is empty</p>
              <p className="text-xs mt-1">Add items to start playing</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};