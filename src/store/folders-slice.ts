/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/* eslint-disable @typescript-eslint/explicit-function-return-type */

import { createSlice } from '@reduxjs/toolkit';
import produce from 'immer';
import { forEach, reduce, cloneDeep, map, filter } from 'lodash';
import { Folder } from '../types/folder';
import { FoldersStateType, MailsFolderMap, StateType } from '../types/state';
import { ISoapFolderObj } from '../types/soap';
import { createFolder } from './actions/create-folder';
import { folderAction } from './actions/folder-action';
import { searchFolder } from './actions/search-folders';
import { extractFolders } from '../views/sidebar/utils';
import { shareFolder } from './actions/share-folder';
import {
	handleCreatedFoldersReducer,
	handleModifiedFoldersReducer,
	handleDeletedFoldersReducer,
	handleRefreshReducer
} from './sync/folder';
import { addFoldersToStore, removeFoldersFromStore, updateFolderInStore } from './utils';

function addFolderPending(state: FoldersStateType, { meta }: any): void {
	const { parentFolder, name, id } = meta.arg;
	// eslint-disable-next-line no-param-reassign
	meta.arg.prevState = cloneDeep(state.folders);
	// eslint-disable-next-line no-param-reassign
	meta.arg.tmpId = new Date().valueOf().toString();
	const folder = {
		[id]: {
			id,
			name,
			path: `/${parentFolder.path}/${name}`,
			parent: parentFolder.id,
			absParent: parentFolder.absParent || undefined,
			itemsCount: 0,
			size: undefined,
			unreadCount: 0,
			synced: false
		}
	};
	addFoldersToStore(state, folder);
	updateFolderInStore(state, []);
	state.status = 'adding';
}

type AddFolderFulFilled = {
	meta: {
		arg: {
			id: string;
			name: string;
			parentFolder: Folder;
			prevState: FoldersStateType;
			tmpId: string;
		};
	};
	payload: ISoapFolderObj[];
};
function addFolderFulFilled(state: FoldersStateType, { meta, payload }: AddFolderFulFilled): void {
	const newFolder = {
		[payload[0].id]: {
			...payload[0],
			itemsCount: payload[0].n,
			id: payload[0].id,
			color: payload[0].color,
			path: payload[0].absFolderPath,
			parent: payload[0].l,
			name: payload[0].name,
			absParent: payload[0].absParent || undefined,
			deletable: payload[0].deletable,
			view: payload[0].view,
			uuid: payload[0].uuid,
			parentUuid: payload[0].luuid,
			unreadCount: payload[0].n || 0,
			rgb: payload[0].rgb
		}
	};
	removeFoldersFromStore(state, [meta.arg.id]);
	addFoldersToStore(state, newFolder);
	state.status = 'idle';
}

function addFolderRejected(state: FoldersStateType, { meta }: any): void {
	state.folders = meta.arg.prevState;
	state.status = 'failed';
}

function folderActionPending(state: FoldersStateType, { meta }: any): void {
	const { folder, l, op, name, color, zid } = meta.arg;
	// eslint-disable-next-line no-param-reassign
	meta.arg.prevFolderState = cloneDeep(state.folders);
	const newFolder = { ...folder, parent: l, name: name || folder.label, label: name };

	switch (op) {
		case 'move':
			state.folders = reduce(
				state.folders,
				(r, v, k) => {
					if (v.id === newFolder.id) {
						return r;
					}
					return { ...r, [k]: v };
				},
				{}
			);
			state.folders[newFolder.id] = newFolder;
			updateFolderInStore(state, [newFolder]);
			state.status = 'updating';
			break;

		case '!grant': {
			const newAcl = filter(folder.acl.grant, (rights) => rights.zid !== zid);
			const updatedFolder = { ...folder, acl: newAcl.length > 0 ? { grant: newAcl } : {} };
			state.folders = reduce(
				state.folders,
				(r, v, k) => {
					if (v.id === updatedFolder.id) {
						return r;
					}
					return { ...r, [k]: v };
				},
				{}
			);
			state.folders[updatedFolder.id] = updatedFolder;
			updateFolderInStore(state, []);
			state.status = 'updating';
			break;
		}
		case 'delete':
			removeFoldersFromStore(state, [folder.id]);
			break;

		case 'update':
			// eslint-disable-next-line no-case-declarations
			const paths = folder.path.split('/');
			paths.pop();
			paths.push(name);
			state.folders[folder.id] = { ...folder, name, color, path: paths.join('/') };
			updateFolderInStore(state, []); // todo: what is this for?
			state.status = 'updating';
			break;
		case 'rename':
			// eslint-disable-next-line no-case-declarations
			const pathArray = folder.path.split('/');
			pathArray.pop();
			pathArray.push(name);
			state.folders[folder.id] = { ...folder, name, path: pathArray.join('/') };
			updateFolderInStore(state, []);
			state.status = 'updating';
			break;

		case 'empty':
			// eslint-disable-next-line no-case-declarations
			const tmp = map(
				filter(state.folders, (item) => item.absParent === folder.id),
				(f) => f.id
			);
			removeFoldersFromStore(state, tmp);
			break;
		default:
			// eslint-disable-next-line no-console
			console.warn('Operation not handled', op);
	}
}

function folderActionFulFilled(state: FoldersStateType): void {
	state.status = 'idle';
}

function folderActionRejected(state: FoldersStateType, { meta }: any): void {
	state.folders = meta.arg.prevFolderState;
	state.status = 'failed';
}

type acl = {
	d: string;
	gt: string;
	zid: string;
	perm: string;
};

function shareFolderFulFilled(state: FoldersStateType, { meta, payload }: any): void {
	const { shareWithUserRole, shareWithUserType, folder } = meta.arg;
	const { FolderActionResponse } = payload.response.Body.BatchResponse;

	const tmpAcl = map(FolderActionResponse, (a) => a.action);
	const aclReduce = folder.acl?.grant
		? reduce(
				folder.acl?.grant,
				(r: Array<acl>, v: acl) => {
					if (filter(tmpAcl, { d: v.d }).length > 0) {
						return [...r, { d: v.d, gt: shareWithUserType, perm: shareWithUserRole, zid: v.zid }];
					}
					return [...r, v];
				},
				[]
		  )
		: map(tmpAcl, (a) => ({
				d: a.d,
				gt: shareWithUserType,
				perm: shareWithUserRole,
				zid: a.zid
		  }));

	const updatedFolder = {
		...folder,
		acl: aclReduce.length > 0 ? { grant: aclReduce } : {}
	};
	state.folders = reduce(
		state.folders,
		(r, v, k) => {
			if (v.id === updatedFolder.id) {
				return r;
			}
			return { ...r, [k]: v };
		},
		{}
	);
	state.folders[updatedFolder.id] = updatedFolder;
	updateFolderInStore(state, []);
	state.status = 'updating';
}

function searchFolderFulFilled(state: any, { payload }: any): void {
	const folders = extractFolders([
		...(payload?.folder?.[0].folder || []),
		...(payload?.folder?.[0]?.link || [])
	]);
	forEach(folders, (f) => {
		if (state.folders[Number(f.id)]) {
			state.folders[Number(f.id)].unreadCount = f.unreadCount;
			state.folders[Number(f.id)].acl = f.acl;
			state.folders[Number(f.id)].perm = f.perm;
		}
	});
}

export const foldersSlice = createSlice({
	name: 'folders',
	initialState: {
		status: 'idle',
		folders: {} as MailsFolderMap
	} as FoldersStateType,
	reducers: {
		handleCreatedFolders: produce(handleCreatedFoldersReducer),
		handleModifiedFolders: produce(handleModifiedFoldersReducer),
		handleDeletedFolders: produce(handleDeletedFoldersReducer),
		handleRefresh: produce(handleRefreshReducer)
	},
	extraReducers: (builder) => {
		builder.addCase(createFolder.pending, addFolderPending);
		builder.addCase(createFolder.fulfilled, addFolderFulFilled);
		builder.addCase(createFolder.rejected, addFolderRejected);
		builder.addCase(folderAction.pending, folderActionPending);
		builder.addCase(folderAction.fulfilled, folderActionFulFilled);
		builder.addCase(folderAction.rejected, folderActionRejected);
		builder.addCase(searchFolder.fulfilled, searchFolderFulFilled);
		// in shareFolder.pending state the modal state on the sidebar is reset to ''
		builder.addCase(shareFolder.fulfilled, shareFolderFulFilled);
	}
});
export const { handleCreatedFolders, handleModifiedFolders, handleDeletedFolders, handleRefresh } =
	foldersSlice.actions;
export const folderSliceReducer = foldersSlice.reducer;

export function selectFolders({ folders }: StateType): MailsFolderMap {
	return folders ? folders.folders : {};
}

export function selectFoldersStatus({ folders }: StateType): string {
	return folders.status;
}
