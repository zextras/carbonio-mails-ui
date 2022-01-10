/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createContext } from 'react';

export const FilterContext = createContext({
	incomingFilters: {},
	incomingLoading: true,
	outgoingFilters: {},
	outgoingLoading: true
});
