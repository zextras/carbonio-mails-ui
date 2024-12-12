/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { normalizeMailMessageFromSoap } from '../../normalizations/normalize-message';
import type { MailMessage } from '../../types';
import { getMsgSoapAPI } from '../get-msg';

type GetMsgCallProps = {
	msgId: string;
};

export const getMsg = async ({ msgId }: GetMsgCallProps): Promise<MailMessage> => {
	const result = await getMsgSoapAPI({ msgId, max: 250000 });
	const msg = result?.m[0];
	return normalizeMailMessageFromSoap(msg, true) as MailMessage;
};

export const getFullMsg = async ({ msgId }: GetMsgCallProps): Promise<MailMessage> => {
	const result = await getMsgSoapAPI({ msgId });
	const msg = result?.m[0];
	return normalizeMailMessageFromSoap(msg, true) as MailMessage;
};
