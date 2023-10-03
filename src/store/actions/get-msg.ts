/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createAsyncThunk } from '@reduxjs/toolkit';
import { soapFetch } from '@zextras/carbonio-shell-ui';
import { map } from 'lodash';

import { normalizeMailMessageFromSoap } from '../../normalizations/normalize-message';
import type { GetMsgParameters, MailMessage, GetMsgRequest, GetMsgResponse } from '../../types';

export const getMsgCall = async ({
	msgId,
	requestedHeaders
}: GetMsgParameters): Promise<MailMessage> => {
	const headers = requestedHeaders
		? map(requestedHeaders, (header) => ({
				n: header
		  }))
		: undefined;
	const result = (await soapFetch<GetMsgRequest, GetMsgResponse>('GetMsg', {
		_jsns: 'urn:zimbraMail',
		m: {
			html: 1,
			id: msgId,
			needExp: 1,
			...(headers ? { header: headers } : undefined)
		}
	})) as GetMsgResponse;
	const msg = result?.m[0];
	return normalizeMailMessageFromSoap(msg, true) as MailMessage;
};

export const getMsg = createAsyncThunk<MailMessage, GetMsgParameters>(
	'messages/getMsg',
	getMsgCall
);
