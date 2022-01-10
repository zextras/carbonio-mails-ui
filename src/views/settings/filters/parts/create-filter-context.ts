/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createContext } from 'react';

type CreateFilterContextType = {
	newFilters: Array<any>;
	setNewFilters: (arg: any) => void;
};

export const CreateFilterContext = createContext<CreateFilterContextType>({
	newFilters: [],
	// eslint-disable-next-line @typescript-eslint/no-empty-function
	setNewFilters: (arg) => {}
});
