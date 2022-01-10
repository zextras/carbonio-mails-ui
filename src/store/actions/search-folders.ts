/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createAsyncThunk } from '@reduxjs/toolkit';
import { soapFetch } from '@zextras/zapp-shell';

export const searchFolder = createAsyncThunk('folders/search_folder', async (): Promise<any> => {
	const res = await soapFetch('GetFolder', {
		_jsns: 'urn:zimbraMail',
		folder: {},
		tr: true
	});
	return res;
});
