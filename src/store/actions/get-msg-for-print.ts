/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createAsyncThunk } from '@reduxjs/toolkit';
import { soapFetch } from '@zextras/carbonio-shell-ui';
import { map } from 'lodash';
import { normalizeMailMessageFromSoap } from '../../normalizations/normalize-message';
import { MailMessage } from '../../types/mail-message';
import { GetMsgRequest, GetMsgResponse } from '../../types/soap/';

export const getMsgsForPrint = createAsyncThunk<any>('messages/getMsg', async ({ ids }: any) => {
	const result = await soapFetch('Batch', {
		GetMsgRequest: map(ids, (id) => ({
			m: {
				html: 1,
				id,
				needExp: 1
			},
			_jsns: 'urn:zimbraMail'
		})),
		_jsns: 'urn:zimbra'
	});
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	const groupedMsgs = map(result.GetMsgResponse, (re) => {
		const msg = re.m[0];
		return normalizeMailMessageFromSoap(msg, true) as MailMessage;
	});
	return groupedMsgs;
});
