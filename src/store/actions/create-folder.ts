/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createAsyncThunk } from '@reduxjs/toolkit';
import { soapFetch } from '@zextras/zapp-shell';

export const createFolder = createAsyncThunk(
	'folder-panel/createFolder',
	async ({ parentFolder, name }: any) => {
		const { folder } = (await soapFetch('CreateFolder', {
			_jsns: 'urn:zimbraMail',
			folder: {
				view: 'message',
				l: parentFolder.id || '2',
				name
			}
		})) as { folder: any };
		return folder;
	}
);
