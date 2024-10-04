/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createAsyncThunk } from '@reduxjs/toolkit';

import { getMsgSoapAPI } from '../../api/get-msg';
import { normalizeMailMessageFromSoap } from '../../normalizations/normalize-message';
import type { MailMessage } from '../../types';

type GetMsgCallProps = {
	msgId: string;
};

export const getMsgCall = async ({ msgId }: GetMsgCallProps): Promise<MailMessage> => {
	const result = await getMsgSoapAPI({ msgId, max: 250000 });
	const msg = result?.m[0];
	return normalizeMailMessageFromSoap(msg, true) as MailMessage;
};

const getFullMsgCall = async ({ msgId }: GetMsgCallProps): Promise<MailMessage> => {
	const result = await getMsgSoapAPI({ msgId });
	const msg = result?.m[0];
	return normalizeMailMessageFromSoap(msg, true) as MailMessage;
};

export const getMsgAsyncThunk = createAsyncThunk<MailMessage, GetMsgCallProps>(
	'messages/getMsg',
	getMsgCall
);

export const getFullMsgAsyncThunk = createAsyncThunk<MailMessage, GetMsgCallProps>(
	'messages/getFullMsg',
	getFullMsgCall
);
