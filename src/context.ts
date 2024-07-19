/**
 * MIT License
 *
 * Author: Josef Barnes
 *
 * This file creates all of the contexts used in the app
 */

import { createContext } from 'react';
import { Session } from 'next-auth';

/* A context to access the logged in users session information */
export const SessionContext = createContext<Session>({ expires: '' });

/* A context to allow access to the search filters provided by a user */
export const SearchContext = createContext<SearchFilter>({});

/* A context to allow pages to add icons to the navbar */
export const NavBarIconContext = createContext<(v: NavBarIcon[]) => void>((v) => {});
