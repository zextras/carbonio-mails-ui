/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useMemo } from 'react';

import { useLocalStorage } from '@zextras/carbonio-shell-ui';

import {
	LOCAL_STORAGE_LAYOUT,
	LOCAL_STORAGE_SPLIT_LAYOUT_ORIENTATION,
	MAILS_VIEW_LAYOUTS,
	MAILS_VIEW_SPLIT_LAYOUT_ORIENTATIONS
} from '../constants';
import type { MailsListLayout, MailsSplitLayoutOrientation } from '../views/folder-view';

export type UseViewLayoutResult = {
	readonly currentLayout: MailsListLayout;
	readonly setCurrentLayout: (layout: MailsListLayout) => void;
	readonly splitLayoutOrientation: MailsSplitLayoutOrientation;
	readonly setSplitLayoutOrientation: (orientation: MailsSplitLayoutOrientation) => void;
	readonly isCurrentLayoutVerticalSplit: boolean;
	readonly isCurrentLayoutHorizontalSplit: boolean;
	readonly isCurrentLayoutNoSplit: boolean;
};

export const useViewLayout = (): UseViewLayoutResult => {
	const [layout, storeLayout] = useLocalStorage<MailsListLayout>(
		LOCAL_STORAGE_LAYOUT,
		MAILS_VIEW_LAYOUTS.SPLIT
	);

	const [splitLayoutOrientation, storeSplitLayoutOrientation] =
		useLocalStorage<MailsSplitLayoutOrientation>(
			LOCAL_STORAGE_SPLIT_LAYOUT_ORIENTATION,
			MAILS_VIEW_SPLIT_LAYOUT_ORIENTATIONS.VERTICAL
		);

	const isCurrentLayoutVerticalSplit = useMemo(
		() =>
			layout === MAILS_VIEW_LAYOUTS.SPLIT &&
			splitLayoutOrientation === MAILS_VIEW_SPLIT_LAYOUT_ORIENTATIONS.VERTICAL,
		[layout, splitLayoutOrientation]
	);

	const isCurrentLayoutHorizontalSplit = useMemo(
		() =>
			layout === MAILS_VIEW_LAYOUTS.SPLIT &&
			splitLayoutOrientation === MAILS_VIEW_SPLIT_LAYOUT_ORIENTATIONS.HORIZONTAL,
		[layout, splitLayoutOrientation]
	);

	const isCurrentLayoutNoSplit = useMemo(() => layout === MAILS_VIEW_LAYOUTS.NO_SPLIT, [layout]);

	return {
		currentLayout: layout,
		setCurrentLayout: storeLayout,
		splitLayoutOrientation,
		setSplitLayoutOrientation: storeSplitLayoutOrientation,
		isCurrentLayoutVerticalSplit,
		isCurrentLayoutHorizontalSplit,
		isCurrentLayoutNoSplit
	};
};
