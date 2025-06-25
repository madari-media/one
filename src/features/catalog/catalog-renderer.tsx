import React from 'react';
import { useCatalogMeta, useCatalogs } from '../../service/catalog/provider';
import { MetaCard } from './meta-card';
import { FeaturedCatalog } from './featured-catalog';
import { useAtom } from 'jotai';
import { selectedContentTypeAtom } from '@/layout/atoms.ts';

interface CatalogRenderItemProps {
  catalog: {
    id: string;
    title: string;
    featured?: boolean;
  };
  cardSize: number;
}

const CatalogRenderItem: React.FC<CatalogRenderItemProps> = ({
  catalog,
  cardSize,
}) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const {
    meta,
    loading: metaLoading,
    error: metaError,
  } = useCatalogMeta(catalog.id);
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [, setNextImage] = React.useState<string | null>(null);
  const [isExpanded, setIsExpanded] = React.useState(false);

  // Preload next image
  React.useEffect(() => {
    if (catalog.featured && meta.length > 0) {
      const nextIndex = (currentIndex + 1) % meta.length;
      const img = new Image();
      img.src = meta[nextIndex].background;
      setNextImage(meta[nextIndex].background);
    }
  }, [catalog.featured, meta, currentIndex]);

  React.useEffect(() => {
    if (catalog.featured && meta.length > 0) {
      const interval = setInterval(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % meta.length);
      }, 30_000);

      return () => clearInterval(interval);
    }
  }, [catalog.featured, meta.length]);

  const scrollLeft = () => {
    if (containerRef.current) {
      containerRef.current.scrollBy({
        left: -cardSize * 2,
        behavior: 'smooth',
      });
    }
    if (catalog.featured) {
      setCurrentIndex(
        (prevIndex) => (prevIndex - 1 + meta.length) % meta.length,
      );
    }
  };

  const scrollRight = () => {
    if (containerRef.current) {
      containerRef.current.scrollBy({
        left: cardSize * 2,
        behavior: 'smooth',
      });
    }
    if (catalog.featured) {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % meta.length);
    }
  };

  if (metaLoading) {
    if (catalog.featured) {
      return (
        <div className="mb-1">
          <div className="relative h-[55vh] md:h-[65vh] overflow-hidden rounded-lg bg-zinc-800 animate-pulse">
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 via-black/20" />
            <div className="absolute inset-0 flex flex-col justify-end p-4 sm:p-6">
              <div className="flex items-end gap-4 sm:gap-6">
                <div className="w-48 h-64 bg-zinc-700 rounded-lg animate-pulse hidden md:block" />
                <div className="flex-1 space-y-4">
                  <div className="h-8 w-64 bg-zinc-700 rounded-lg animate-pulse" />
                  <div className="h-4 w-full bg-zinc-700 rounded-lg animate-pulse" />
                  <div className="h-4 w-3/4 bg-zinc-700 rounded-lg animate-pulse" />
                  <div className="flex gap-4">
                    <div className="h-10 w-24 bg-zinc-700 rounded-lg animate-pulse" />
                    <div className="h-10 w-24 bg-zinc-700 rounded-lg animate-pulse" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="mb-1">
        <div className="h-8 w-48 bg-zinc-800 rounded-lg animate-pulse mb-4" />
        <div
          ref={containerRef}
          className="flex overflow-x-auto pb-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        >
          <div className="flex gap-4">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="flex-shrink-0 bg-zinc-800 rounded-lg animate-pulse"
                style={{
                  width: `${cardSize}px`,
                  height: `${cardSize * 1.5}px`,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (metaError) {
    return (
      <div className="mb-1">
        <h2 className="text-2xl font-bold mb-4 text-white">{catalog.title}</h2>
        <div className="p-4 bg-zinc-800 rounded-lg">
          <p className="text-red-500">Error loading metadata</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 px-4 py-2 bg-zinc-700 text-white rounded-lg hover:bg-zinc-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-1 relative">
      {!catalog.featured && (
        <div className="flex justify-between items-center mb-4 sm:mb-6 px-2 sm:px-4">
          <h2 className="text-lg heading-font sm:text-xl md:text-2xl font-bold text-white">
            {catalog.title}
          </h2>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-white hover:text-zinc-300 transition-colors"
            title={isExpanded ? "Collapse view" : "Expand view"}
          >
            {isExpanded ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                />
              </svg>
            )}
          </button>
        </div>
      )}

      {catalog.featured ? (
        <div className="p-1 sm:p-2 pt-12 sm:pt-18">
          <FeaturedCatalog
            meta={meta}
            currentIndex={currentIndex}
            onScrollLeft={scrollLeft}
            onScrollRight={scrollRight}
          />
        </div>
      ) : (
        <div className="px-2 sm:px-4">
          {isExpanded ? (
            <div className="flex flex-wrap gap-2 sm:gap-4">
              {meta.map((item, index) => (
                <div
                  key={`${item.id}-${index}`}
                  className="flex-shrink-0"
                  style={{
                    width: `${cardSize * 2}px`,
                  }}
                >
                  <MetaCard meta={item} cardSize={cardSize} />
                </div>
              ))}
            </div>
          ) : (
            <div
              ref={containerRef}
              className="flex overflow-x-auto pb-2 sm:pb-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
            >
              <div className="flex gap-2 sm:gap-4">
                {meta.map((item, index) => (
                  <div
                    key={`${item.id}-${index}`}
                    className="flex-shrink-0"
                    style={{
                      width: `${cardSize * 2}px`,
                    }}
                  >
                    <MetaCard meta={item} cardSize={cardSize} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const CatalogRenderer: React.FC = () => {
  const {
    catalogs,
    loading: catalogsLoading,
    error: catalogsError,
  } = useCatalogs();
  const [cardSize, setCardSize] = React.useState(280);
  const [selectedContentType] = useAtom(selectedContentTypeAtom);

  React.useEffect(() => {
    const updateCardSize = () => {
      const width = window.innerWidth;
      if (width < 640) {
        // sm
        setCardSize(160);
      } else if (width < 768) {
        // md
        setCardSize(200);
      } else if (width < 1024) {
        // lg
        setCardSize(240);
      } else {
        // xl and above
        setCardSize(280);
      }
    };

    updateCardSize();
    window.addEventListener('resize', updateCardSize);
    return () => window.removeEventListener('resize', updateCardSize);
  }, []);

  // Filter catalogs based on selected content type and exclude continue watching
  const filteredCatalogs = React.useMemo(() => {
    if (!catalogs) return [];
    
    // Filter out continue watching catalog as it's handled separately
    const catalogsWithoutContinue = catalogs.filter(
      catalog => catalog.id !== 'jellyfin-continue'
    );
    
    if (selectedContentType === null) return catalogsWithoutContinue;

    return catalogsWithoutContinue.filter((catalog) => {
      if (selectedContentType === 'movie') {
        return (
          catalog.title.toLowerCase().includes('movie') ||
          catalog.title.toLowerCase().includes('film')
        );
      } else {
        return (
          catalog.title.toLowerCase().includes('tv') ||
          catalog.title.toLowerCase().includes('series')
        );
      }
    });
  }, [catalogs, selectedContentType]);

  if (catalogsLoading) {
    return (
      <div className="space-y-12">
        {[...Array(3)].map((_, index) => (
          <div key={index} className="mb-1">
            <div className="h-8 w-48 bg-zinc-800 rounded-lg animate-pulse mb-4" />
            <div className="flex overflow-x-auto pb-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              <div className="flex gap-4">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="flex-shrink-0 bg-zinc-800 rounded-lg animate-pulse"
                    style={{
                      width: `${cardSize * 2}px`,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (catalogsError) {
    return (
      <div className="text-center p-4">
        <p className="text-red-500 text-lg mb-4">
          Error loading catalogs: {catalogsError.message}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {filteredCatalogs.map((catalog) => (
        <CatalogRenderItem
          key={catalog.id}
          catalog={catalog}
          cardSize={cardSize}
        />
      ))}
    </div>
  );
};
