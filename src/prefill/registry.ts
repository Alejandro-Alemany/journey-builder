import type { PrefillDataSource } from "./types";
import { directDependenciesSource } from "./sources/directDependencies";
import { transitiveDependenciesSource } from "./sources/transitiveDependencies";
import { globalDataSource } from "./sources/globalData";

/**
 * The registry of available prefill data sources.
 *
 * To add a new data source:
 *   1. Create a file in src/prefill/sources/ exporting an object that
 *      implements PrefillDataSource.
 *   2. Append it to this array.
 *   No other files need to change.
 */
export const dataSources: PrefillDataSource[] = [
  globalDataSource,
  directDependenciesSource,
  transitiveDependenciesSource,
];


