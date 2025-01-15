/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { FilterAction } from '../../../types';

export type OnFilterActionChange = (filterActionValue: FilterAction) => void;

export type ActionComponentProps<T extends FilterAction> = {
	value: T;
	onChange: OnFilterActionChange;
};
