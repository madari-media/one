import React from 'react';
import { MetaExtended } from '@/service/type';
import { Button } from '@/components/ui/button.tsx';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface SeasonSelectorProps {
  meta: MetaExtended;
  selectedSeason: number | null;
  onSeasonSelect: (seasonNumber: number) => void;
}

export const SeasonSelector: React.FC<SeasonSelectorProps> = ({
  meta,
  selectedSeason,
  onSeasonSelect,
}) => {
  if (meta.metaType !== 'tv' || !meta.seasons || meta.seasons.length === 0) {
    return null;
  }

  const renderSeasonLabel = (seasonNumber: number) => {
    return seasonNumber === 0 ? 'Specials' : `Season ${seasonNumber}`;
  };

  if (meta.seasons.length > 4) {
    return (
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-6 heading-font">Seasons</h2>
        <div className="relative">
          <Select
            value={selectedSeason?.toString()}
            onValueChange={(value: string) => onSeasonSelect(parseInt(value))}
          >
            <SelectTrigger className="w-[200px] bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700 transition-colors">
              <SelectValue placeholder="Select a season" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-800 border-zinc-700">
              {meta.seasons.map((season) => (
                <SelectItem
                  key={season.seasonNumber}
                  value={season.seasonNumber.toString()}
                  className="text-zinc-300 hover:bg-zinc-700 focus:bg-zinc-700 cursor-pointer"
                >
                  {renderSeasonLabel(season.seasonNumber)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-12">
      <h2 className="text-2xl font-bold mb-6 heading-font">Seasons</h2>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {meta.seasons.map((season) => (
          <Button
            size="lg"
            key={season.seasonNumber}
            onClick={() => onSeasonSelect(season.seasonNumber)}
            className={`flex-shrink-0 heading-font rounded-lg transition-all duration-200 transform hover:scale-105 ${
              selectedSeason === season.seasonNumber
                ? 'bg-red-600 text-white shadow-lg shadow-red-600/20'
                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
            }`}
          >
            {renderSeasonLabel(season.seasonNumber)}
          </Button>
        ))}
      </div>
    </div>
  );
};