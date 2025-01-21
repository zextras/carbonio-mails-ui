/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { msgActionSoapApi } from '../../../api/msg-action-soap-api';
import { MsgActionParameters, MsgActionResponse } from '../../../types/soap/msg-action';
import { optimisticallyHandleMessageActions } from '../store';

export async function msgActionEmailStoreAction({
	ids,
	operation,
	parent,
	tagName,
	flag
}: MsgActionParameters): Promise<MsgActionResponse> {
	optimisticallyHandleMessageActions({ ids, operation, parent, tagName, flag });
	return msgActionSoapApi({ ids, operation, parent, tagName, flag });
}
