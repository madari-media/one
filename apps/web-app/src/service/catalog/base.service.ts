import {
  Catalog,
  Meta,
  MetaExtended,
  MetaPerson,
  MetaPersonExtended,
} from '../type';

export interface CatalogBaseService {
  meta(meta: Partial<Meta>): Promise<MetaExtended>;
  search(query: string): Promise<(Meta | MetaPerson)[]>;
  catalogs(): Promise<Catalog[]>;
  catalogMeta(meta: Catalog): Promise<Meta[]>;
  isMetaSupported(meta: Partial<Meta>): Promise<boolean>;
  person(person: Partial<MetaPerson>): Promise<MetaPersonExtended>;

  loadSeasonDetails?(
    meta: Partial<Meta>,
    seasonNumber: number,
  ): Promise<MetaExtended['seasons']>;
  loadRelated?(meta: Partial<Meta>): Promise<MetaExtended[]>;
}

export class CatalogBaseCallerService {
  constructor(private readonly _catalog: CatalogBaseService[]) {}

  async *meta(meta: Partial<Meta>): AsyncGenerator<MetaExtended> {
    for (const catalog of this._catalog) {
      if (await catalog.isMetaSupported(meta)) {
        yield await catalog.meta(meta);
      }
    }
  }

  async *search(query: string): AsyncGenerator<Meta | MetaPerson> {
    for (const catalog of this._catalog) {
      const results = await catalog.search(query);
      for (const result of results) {
        yield result;
      }
    }
  }

  async *catalogs(): AsyncGenerator<Catalog> {
    for (const catalog of this._catalog) {
      const results = await catalog.catalogs();
      for (const result of results) {
        yield result;
      }
    }
  }

  async *catalogMeta(catalog: Catalog): AsyncGenerator<Meta> {
    for (const catalogService of this._catalog) {
      const results = await catalogService.catalogMeta(catalog);
      for (const result of results) {
        yield result;
      }
    }
  }

  async getFirstMeta(meta: Partial<Meta>): Promise<MetaExtended | null> {
    for await (const result of this.meta(meta)) {
      return result;
    }

    return null;
  }

  async getAllMeta(meta: Meta): Promise<MetaExtended[]> {
    const results: MetaExtended[] = [];
    for await (const result of this.meta(meta)) {
      results.push(result);
    }
    return results;
  }

  async getAllSearchResults(query: string): Promise<(Meta | MetaPerson)[]> {
    const results: (Meta | MetaPerson)[] = [];
    for await (const result of this.search(query)) {
      results.push(result);
    }
    return results;
  }

  async getAllCatalogs(): Promise<Catalog[]> {
    const results: Catalog[] = [];
    for await (const result of this.catalogs()) {
      results.push(result);
    }
    return results;
  }

  async getAllCatalogMeta(catalog: Catalog): Promise<Meta[]> {
    const results: Meta[] = [];
    for await (const result of this.catalogMeta(catalog)) {
      results.push(result);
    }
    return results;
  }

  async loadSeasonDetails(
    meta: Partial<Meta>,
    seasonNumber: number,
  ): Promise<MetaExtended['seasons']> {
    for (const catalog of this._catalog) {
      if (catalog.loadSeasonDetails) {
        if (await catalog.isMetaSupported(meta)) {
          return await catalog.loadSeasonDetails(meta, seasonNumber);
        }
      }
    }
    return [];
  }

  async loadRelated(meta: Partial<Meta>): Promise<MetaExtended[]> {
    const results: MetaExtended[] = [];
    for (const catalog of this._catalog) {
      if (catalog.loadRelated) {
        const related = await catalog.loadRelated(meta);
        results.push(...related);
      }
    }
    return results;
  }

  async person(person: Partial<MetaPerson>): Promise<MetaPersonExtended> {
    for (const catalog of this._catalog) {
      try {
        return await catalog.person(person);
      } catch (error) {
        // Try next catalog
        continue;
      }
    }
    throw new Error('No catalog could load person details');
  }
}
