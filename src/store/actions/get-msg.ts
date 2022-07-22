/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createAsyncThunk } from '@reduxjs/toolkit';
import { soapFetch } from '@zextras/carbonio-shell-ui';
import { normalizeMailMessageFromSoap } from '../../normalizations/normalize-message';
import { GetMsgParameters, MailMessage, GetMsgRequest, GetMsgResponse } from '../../types';

export const getMsg = createAsyncThunk<MailMessage, GetMsgParameters>(
	'messages/getMsg',
	async ({ msgId }) => {
		const result = (await soapFetch<GetMsgRequest, GetMsgResponse>('GetMsg', {
			_jsns: 'urn:zimbraMail',
			m: {
				html: 1,
				id: msgId,
				needExp: 1
			}
		})) as GetMsgResponse;
		const msg = result?.m[0];
		return normalizeMailMessageFromSoap(msg, true) as MailMessage;
	}
);
