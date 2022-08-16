/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createContext } from 'react';

type FilterContextType = {
	incomingFilters: Record<string, any> | Array<any>;
	incomingLoading: boolean;
	outgoingFilters: Record<string, any> | Array<any>;
	outgoingLoading: boolean;
	setFetchIncomingFilters?: (arg: boolean) => void;
	moveUp?: (index: number, list: Array<any>, listSetter: (arg2: any) => void) => void;
	setIncomingFilters?: (arg: any) => void;
	setOutgoingFilters?: (arg: any) => void;
	setFetchOutgoingFilters?: (arg: boolean) => void;
};
export const FilterContext = createContext<FilterContextType>({
	incomingFilters: {},
	incomingLoading: true,
	outgoingFilters: {},
	outgoingLoading: true
});
