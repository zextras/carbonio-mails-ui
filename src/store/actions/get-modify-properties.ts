/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createAsyncThunk } from '@reduxjs/toolkit';
import { soapFetch } from '@zextras/carbonio-shell-ui';

export const getModifyPropertiesRequest = createAsyncThunk(
	'mails_snackbar_delay',
	async ({ timer = '3' }: { timer: string }): Promise<any> => {
		const resp = await soapFetch('ModifyProperties', {
			_jsns: 'urn:zimbraAccount',
			prop: { name: 'mails_snackbar_delay', _content: timer, zimlet: 'com_zextras_zapp_mails' }
		});
		return resp;
	}
);
