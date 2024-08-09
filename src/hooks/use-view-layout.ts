/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useMemo } from 'react';

import { useLocalStorage } from '@zextras/carbonio-shell-ui';

import type { SizeAndPosition } from './use-resize';
import {
	LOCAL_STORAGE_LAYOUT,
	LOCAL_STORAGE_SPLIT_LAYOUT_ORIENTATION,
	LOCAL_STORAGE_VIEW_SIZES,
	MAILS_VIEW_LAYOUTS,
	MAILS_VIEW_SPLIT_LAYOUT_ORIENTATIONS
} from '../constants';
import type { MailsListLayout, MailsSplitLayoutOrientation } from '../views/folder-view';

export type UseViewLayoutResult = {
	readonly currentLayout: MailsListLayout;
	readonly setCurrentLayout: (layout: MailsListLayout) => void;
	readonly splitLayoutOrientation: MailsSplitLayoutOrientation;
	readonly setSplitLayoutOrientation: (orientation: MailsSplitLayoutOrientation) => void;
	readonly listContainerGeometry: Partial<SizeAndPosition>;
	readonly setListContainerGeometry: (geometry: Partial<SizeAndPosition>) => void;
	readonly isCurrentLayoutSplit: boolean;
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

	const [listContainerGeometry, setListContainerGeometry] = useLocalStorage<
		Partial<SizeAndPosition>
	>(LOCAL_STORAGE_VIEW_SIZES, {}, { keepSyncedWithStorage: true });

	const isCurrentLayoutVerticalSplit =
		layout === MAILS_VIEW_LAYOUTS.SPLIT &&
		splitLayoutOrientation === MAILS_VIEW_SPLIT_LAYOUT_ORIENTATIONS.VERTICAL;

	const isCurrentLayoutHorizontalSplit =
		layout === MAILS_VIEW_LAYOUTS.SPLIT &&
		splitLayoutOrientation === MAILS_VIEW_SPLIT_LAYOUT_ORIENTATIONS.HORIZONTAL;

	const isCurrentLayoutNoSplit = layout === MAILS_VIEW_LAYOUTS.NO_SPLIT;

	return useMemo(
		() => ({
			currentLayout: layout,
			setCurrentLayout: storeLayout,
			splitLayoutOrientation,
			setSplitLayoutOrientation: storeSplitLayoutOrientation,
			setListContainerGeometry,
			listContainerGeometry,
			isCurrentLayoutSplit: layout === MAILS_VIEW_LAYOUTS.SPLIT,
			isCurrentLayoutVerticalSplit,
			isCurrentLayoutHorizontalSplit,
			isCurrentLayoutNoSplit
		}),
		[
			isCurrentLayoutHorizontalSplit,
			isCurrentLayoutNoSplit,
			isCurrentLayoutVerticalSplit,
			layout,
			setListContainerGeometry,
			splitLayoutOrientation,
			listContainerGeometry,
			storeLayout,
			storeSplitLayoutOrientation
		]
	);
};
