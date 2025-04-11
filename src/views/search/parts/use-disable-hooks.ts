/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useMemo } from 'react';

import type { QueryChip } from '@zextras/carbonio-search-ui';
import { isEqual, sortBy } from 'lodash';

import { UseDisabledPropType } from '../../../types';

const isQueryArraysAreEqual = (newQuery: QueryChip[], currentQuery: QueryChip[]): boolean => {
	if (newQuery.length === 0 && currentQuery.length === 0) return true;
	const sortedNewQuery = sortBy(newQuery.map((item) => item.label));
	const sortedCurrentQuery = sortBy(currentQuery.map((item) => item.label));
	return isEqual(sortedNewQuery, sortedCurrentQuery);
};

export const useDisabled = ({
	queryToBe,
	query,
	isSharedFolderIncluded,
	isSharedFolderIncludedTobe
}: UseDisabledPropType): boolean =>
	useMemo(
		() =>
			isSharedFolderIncluded !== isSharedFolderIncludedTobe
				? false
				: isQueryArraysAreEqual(queryToBe, query),
		[isSharedFolderIncluded, isSharedFolderIncludedTobe, query, queryToBe]
	);
