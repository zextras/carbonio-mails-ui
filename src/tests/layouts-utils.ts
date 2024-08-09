/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useLocalStorage } from '../carbonio-ui-commons/test/mocks/carbonio-shell-ui';
import {
	LOCAL_STORAGE_LAYOUT,
	LOCAL_STORAGE_SPLIT_LAYOUT_ORIENTATION,
	LOCAL_STORAGE_VIEW_SIZES,
	MAILS_VIEW_LAYOUTS,
	MAILS_VIEW_SPLIT_LAYOUT_ORIENTATIONS
} from '../constants';
import { Geometry } from '../hooks/use-resize';
import { MailsListLayout, MailsSplitLayoutOrientation } from '../views/folder-view';

export const mockLayoutStorage = ({
	layout = MAILS_VIEW_LAYOUTS.SPLIT,
	splitOrientation = MAILS_VIEW_SPLIT_LAYOUT_ORIENTATIONS.VERTICAL,
	top = 0,
	left = 500,
	width = 500,
	height = 700,
	callback = jest.fn()
}: {
	layout?: MailsListLayout;
	splitOrientation?: MailsSplitLayoutOrientation;
	callback?: typeof jest.fn;
	top?: number;
	left?: number;
	width?: number;
	height?: number;
} = {}): void => {
	useLocalStorage.mockImplementation(
		(
			key
		): [MailsListLayout | MailsSplitLayoutOrientation | Geometry | undefined, typeof jest.fn] => {
			if (key === LOCAL_STORAGE_LAYOUT) {
				return [layout, callback];
			}
			if (key === LOCAL_STORAGE_SPLIT_LAYOUT_ORIENTATION) {
				return [splitOrientation, callback];
			}

			if (key === LOCAL_STORAGE_SPLIT_LAYOUT_ORIENTATION) {
				return [splitOrientation, callback];
			}

			if (key === LOCAL_STORAGE_VIEW_SIZES) {
				return [{ width, height, top, left }, callback];
			}

			return [undefined, callback];
		}
	);
};
