/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { t } from '@zextras/carbonio-shell-ui';

import { SORTING_DIRECTION, SORTING_OPTIONS } from '../../../../../constants';
import { Folder } from '../../../../../types';
import { getFolderTranslatedName } from '../../../../sidebar/utils';

export function getTooltipLabel(sortingType: string, sortingDirection: string): string {
	const sortingString = `${sortingType}${sortingDirection}`;
	switch (sortingString) {
		case `${SORTING_OPTIONS.to.value}${SORTING_DIRECTION.ASCENDING}`:
			return t('sortingDropdown.tooltip.toAscending', 'Ascending order by To');
		case `${SORTING_OPTIONS.date.value}${SORTING_DIRECTION.ASCENDING}`:
			return t('sortingDropdown.tooltip.dateAscending', 'Ascending order by Date');
		case `${SORTING_OPTIONS.from.value}${SORTING_DIRECTION.ASCENDING}`:
			return t('sortingDropdown.tooltip.fromAscending', 'Ascending order by From');
		case `${SORTING_OPTIONS.size.value}${SORTING_DIRECTION.ASCENDING}`:
			return t('sortingDropdown.tooltip.dateAscending', 'Ascending order by Size');
		case `${SORTING_OPTIONS.unread.value}${SORTING_DIRECTION.ASCENDING}`:
			return t('sortingDropdown.tooltip.unreadAscending', 'Ascending order by Unread');
		case `${SORTING_OPTIONS.flagged.value}${SORTING_DIRECTION.ASCENDING}`:
			return t('sortingDropdown.tooltip.flaggedAscending', 'Ascending order by Flagged');
		case `${SORTING_OPTIONS.subject.value}${SORTING_DIRECTION.ASCENDING}`:
			return t('sortingDropdown.tooltip.subjectAscending', 'Ascending order by Subject');
		case `${SORTING_OPTIONS.important.value}${SORTING_DIRECTION.ASCENDING}`:
			return t('sortingDropdown.tooltip.importantAscending', 'Ascending order by Important');
		case `${SORTING_OPTIONS.attachment.value}${SORTING_DIRECTION.ASCENDING}`:
			return t('sortingDropdown.tooltip.attachmentAscending', 'Ascending order by Attachment');
		case `${SORTING_OPTIONS.to.value}${SORTING_DIRECTION.DESCENDING}`:
			return t('sortingDropdown.tooltip.toDescending', 'Descending order by To');
		case `${SORTING_OPTIONS.date.value}${SORTING_DIRECTION.DESCENDING}`:
			return t('sortingDropdown.tooltip.dateDescending', 'Descending order by Date');
		case `${SORTING_OPTIONS.from.value}${SORTING_DIRECTION.DESCENDING}`:
			return t('sortingDropdown.tooltip.fromDescending', 'Descending order by From');
		case `${SORTING_OPTIONS.size.value}${SORTING_DIRECTION.DESCENDING}`:
			return t('sortingDropdown.tooltip.sizeDescending', 'Descending order by Size');
		case `${SORTING_OPTIONS.unread.value}${SORTING_DIRECTION.DESCENDING}`:
			return t('sortingDropdown.tooltip.unreadDescending', 'Descending order by Unread');
		case `${SORTING_OPTIONS.flagged.value}${SORTING_DIRECTION.DESCENDING}`:
			return t('sortingDropdown.tooltip.flaggedDescending', 'Descending order by Flagged');
		case `${SORTING_OPTIONS.subject.value}${SORTING_DIRECTION.DESCENDING}`:
			return t('sortingDropdown.tooltip.subjectDescending', 'Descending order by Subject');
		case `${SORTING_OPTIONS.important.value}${SORTING_DIRECTION.DESCENDING}`:
			return t('sortingDropdown.tooltip.importantDescending', 'Descending order by Important');
		case `${SORTING_OPTIONS.attachment.value}${SORTING_DIRECTION.DESCENDING}`:
			return t('sortingDropdown.tooltip.attachmentDescending', 'Descending order by Attachment');
		default:
			return '';
	}
}

export const getFolderPath = (
	folder: Folder | undefined,
	root: Folder | undefined,
	isSearchModule = false
): string => {
	if (isSearchModule) {
		return '';
	}
	return (
		folder?.absFolderPath
			?.split('/')
			?.map((p, idx) =>
				getFolderTranslatedName({
					folderId: idx === 1 ? root?.id : folder?.id,
					folderName: p
				})
			)
			.join(' / ') ?? ''
	);
};
