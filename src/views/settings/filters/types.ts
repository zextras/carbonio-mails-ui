/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { FilterAction } from '../../../types';

export type ActionComponentProps<T extends FilterAction> = {
	value: T;
	onChange: (filterValue: FilterAction) => void;
};

export type ActionComponent<T extends FilterAction> = ({
	value,
	onChange
}: ActionComponentProps<T>) => React.JSX.Element;
