/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { map } from 'lodash';
import type { FolderType, FoldersStateType } from '../../types';
import { extractFolders, normalizeFolder } from '../../views/sidebar/utils';
import { addFoldersToStore, removeFoldersFromStore, updateFolders } from '../utils';

type Payload = {
	payload: any[];
};

export const handleCreatedFoldersReducer = (
	state: FoldersStateType,
	{ payload }: Payload
): void => {
	const foldersToAdd = extractFolders(payload) as Record<string, FolderType>;
	addFoldersToStore(state, Object.values(foldersToAdd));
	updateFolders(state, Object.values(foldersToAdd));
};

export const handleModifiedFoldersReducer = (
	state: FoldersStateType,
	{ payload }: Payload
): void => {
	const foldersToAdd = map(payload, normalizeFolder);
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	updateFolders(state, foldersToAdd);
};

export const handleDeletedFoldersReducer = (
	state: FoldersStateType,
	{ payload }: Payload
): void => {
	removeFoldersFromStore(state, payload);
};

export const handleRefreshReducer = (state: FoldersStateType, { payload }: Payload): void => {
	addFoldersToStore(state, payload);
	updateFolders(state, payload);
};
