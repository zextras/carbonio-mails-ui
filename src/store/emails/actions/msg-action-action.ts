/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ErrorSoapBodyResponse } from '@zextras/carbonio-ui-soap-lib';

import { msgActionSoapApi } from 'api/msg-action-soap-api';
import { optimisticallyHandleMessageActions } from 'store/emails/store';
import { MsgActionParameters, MsgActionResponse } from 'types/soap/msg-action';

export async function msgActionEmailStoreAction({
	ids,
	operation,
	parent,
	tagName,
	flag
}: MsgActionParameters): Promise<MsgActionResponse | ErrorSoapBodyResponse> {
	optimisticallyHandleMessageActions({ ids, operation, parent, tagName, flag });
	return msgActionSoapApi({ ids, operation, parent, tagName, flag });
}
