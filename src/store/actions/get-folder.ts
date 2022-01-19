/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createAsyncThunk } from '@reduxjs/toolkit';
import { soapFetch } from '@zextras/carbonio-shell-ui';

export const getFolder = createAsyncThunk('folders/get folder-panel', async (id): Promise<any> => {
	const { link } = (await soapFetch('GetFolder', {
		_jsns: 'urn:zimbraMail',
		folder: {
			l: id
		}
	})) as { link: any };
	return link?.[0];
});
