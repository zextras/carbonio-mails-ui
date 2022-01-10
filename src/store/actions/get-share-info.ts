/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createAsyncThunk } from '@reduxjs/toolkit';
import { soapFetch } from '@zextras/zapp-shell';

export const getShareInfo = createAsyncThunk('calendar/get share info', async (): Promise<any> => {
	const resp = await soapFetch('GetShareInfo', {
		_jsns: 'urn:zimbraAccount',
		includeSelf: 0
	});
	return resp;
});
