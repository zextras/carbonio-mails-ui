/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { QueryChip } from '@zextras/carbonio-shell-ui';
import { isEqualWith } from 'lodash';
import { useMemo } from 'react';
import { KeywordState, UseDisabledPropType, UseSecondaryDisabledType } from '../../../types';

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
				: isEqualWith(queryToBe, query, (newQuery, currentQuery) => {
						if (newQuery.length === 0 && currentQuery.length === 0) return true;
						if (newQuery.length !== currentQuery.length) return false;
						return newQuery[0].value === currentQuery[0].value;
				  }),
		[isSharedFolderIncluded, isSharedFolderIncludedTobe, query, queryToBe]
	);

export const useSecondaryDisabled = ({
	attachmentFilter,
	attachmentType,
	emailStatus,
	flaggedFilter,
	folder,
	receivedFromAddress,
	sentAfter,
	sentBefore,
	sentFromAddress,
	sentOn,
	sizeLarger,
	sizeSmaller,
	subject,
	tag,
	totalKeywords,
	unreadFilter
}: UseSecondaryDisabledType): boolean =>
	useMemo(
		() =>
			totalKeywords === 0 &&
			subject.length === 0 &&
			attachmentType.length === 0 &&
			emailStatus.length === 0 &&
			sizeSmaller.length === 0 &&
			sizeLarger.length === 0 &&
			unreadFilter.length === 0 &&
			attachmentFilter.length === 0 &&
			flaggedFilter.length === 0 &&
			receivedFromAddress.length === 0 &&
			sentFromAddress.length === 0 &&
			folder.length === 0 &&
			sentBefore.length === 0 &&
			sentOn.length === 0 &&
			sentAfter.length === 0 &&
			tag.length === 0,
		[
			attachmentFilter.length,
			attachmentType.length,
			emailStatus.length,
			flaggedFilter.length,
			folder.length,
			receivedFromAddress.length,
			sentAfter.length,
			sentBefore.length,
			sentFromAddress.length,
			sentOn.length,
			sizeLarger.length,
			sizeSmaller.length,
			subject.length,
			tag.length,
			totalKeywords,
			unreadFilter.length
		]
	);
