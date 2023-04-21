/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createAsyncThunk } from '@reduxjs/toolkit';
import { soapFetch } from '@zextras/carbonio-shell-ui';
import type { ReplyShareParameters, SaveDraftRequest, SaveDraftResponse } from '../../types';
import { generateRequest } from '../editor-slice-utils';

// TODO probably the owner account should be set also here
export const acceptSharedCalendarReply = createAsyncThunk<any, ReplyShareParameters>(
	'sendMsg',
	async ({ data }, { getState, dispatch }) => {
		const toSend = generateRequest(data);
		const resp = await soapFetch<SaveDraftRequest, SaveDraftResponse>('SendMsg', {
			_jsns: 'urn:zimbraMail',
			m: toSend
		});

		return { resp };
	}
);
