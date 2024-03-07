/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createAsyncThunk } from '@reduxjs/toolkit';
import { soapFetch } from '@zextras/carbonio-shell-ui';

import { getConv } from './get-conv';
import { getMsg } from './get-msg';
import { ParticipantRole } from '../../carbonio-ui-commons/constants/participants';
import { getAddressOwnerAccount, getIdentityDescriptor } from '../../helpers/identities';
import { getParticipantsFromMessage } from '../../helpers/messages';
import { MailMessage, SendMsgResult } from '../../types';
import type { SaveDraftRequest, SaveDraftResponse, SendMsgParameters } from '../../types';
import { generateMailRequest } from '../editor-slice-utils';
import { createSoapSendMsgRequestFromEditor } from '../zustand/editor/editor-transformations';

export const sendMsg = createAsyncThunk<any, { msg: MailMessage }>(
	'sendMsg',
	async ({ msg }, { rejectWithValue, dispatch }) => {
		const toSend = generateMailRequest(msg);

		const from = getParticipantsFromMessage(msg, ParticipantRole.FROM)?.[0].address;

		// Get the sender account. If not determined then undefined is passed to the soapFetch which will use the default one
		const account = getAddressOwnerAccount(from);
		let resp;
		try {
			resp = await soapFetch<SaveDraftRequest, SaveDraftResponse>(
				'SendMsg',
				{
					_jsns: 'urn:zimbraMail',
					m: toSend
				},
				account ?? undefined
			);
		} catch (e) {
			console.error(e);
			return rejectWithValue(e);
		}

		const response = resp?.Fault ? { ...resp.Fault, error: true } : resp;
		if (response?.error) {
			return rejectWithValue(response);
		}

		if (response?.m && response?.m[0]?.id) {
			dispatch(getMsg({ msgId: response.m[0].id }));
		}
		if (response?.m && response?.m[0]?.cid) {
			dispatch(getConv({ conversationId: response.m[0].cid }));
		}
		return { response };
	}
);

export const sendMsgFromEditor = createAsyncThunk<SendMsgResult, SendMsgParameters>(
	'sendMsg',
	async ({ editor }, { rejectWithValue, getState, dispatch }) => {
		if (!editor) {
			return rejectWithValue('No editor provided');
		}

		if (!editor.identityId) {
			return rejectWithValue('Missing sender');
		}

		const msg = createSoapSendMsgRequestFromEditor(editor);
		// console.log(editor);
		const identity = getIdentityDescriptor(editor.identityId);

		let resp: SaveDraftResponse;
		try {
			resp = await soapFetch<SaveDraftRequest, SaveDraftResponse>(
				'SendMsg',
				{
					_jsns: 'urn:zimbraMail',
					m: msg
				},
				identity?.ownerAccount ?? undefined
			);
		} catch (e) {
			console.error(e);
			return rejectWithValue(e);
		}

		const response: SendMsgResult['response'] = resp?.Fault ? { ...resp.Fault, error: true } : resp;
		if (response?.error) {
			return rejectWithValue(response);
		}

		if (response?.m && response?.m[0]?.id) {
			dispatch(getMsg({ msgId: response.m[0].id }));
		}
		if (response?.m && response?.m[0]?.cid) {
			dispatch(getConv({ conversationId: response.m[0].cid }));
		}
		return { response };
	}
);
