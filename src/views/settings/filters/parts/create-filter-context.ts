/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createContext } from 'react';

export type CreateFilterContextType = {
	newFilters: Array<any>;
	setNewFilters: (arg: any) => void;
};

export const CreateFilterContext = createContext<CreateFilterContextType>({
	newFilters: [],
	setNewFilters: (arg) => {
		/* default implementation */
	}
});
