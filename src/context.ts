/**
 * MIT License
 *
 * Author: Josef Barnes
 *
 * This file creates all of the contexts used in the app
 */

import { createContext } from 'react';

/* A context to allow access to the search filters provided by a user */
export const SearchContext = createContext<SearchFilter>({});
