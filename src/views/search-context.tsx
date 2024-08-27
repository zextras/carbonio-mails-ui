/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createContext, useContext } from 'react';

export const SearchContext = createContext<boolean>(false);

export const useSearchContext = (): boolean => useContext(SearchContext);
