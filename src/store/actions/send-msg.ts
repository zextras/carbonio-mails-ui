/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createAsyncThunk } from '@reduxjs/toolkit';
import { getUserAccount, getUserSettings, soapFetch } from '@zextras/carbonio-shell-ui';
import { ParticipantRole } from '../../carbonio-ui-commons/constants/participants';
import { getAddressOwnerAccount } from '../../helpers/identities';
import { collectParticipantsFromMessage } from '../../helpers/messages';
import type {
	SaveDraftRequest,
	SaveDraftResponse,
	SendMsgParameters,
	StateType
} from '../../types';
import { closeEditor } from '../editor-slice';
import { generateMailRequest, generateRequest } from '../editor-slice-utils';
import { getConv } from './get-conv';
import { getMsg } from './get-msg';

export const sendMsg = createAsyncThunk<any, SendMsgParameters>(
	'sendMsg',
	async ({ editorId, msg, prefs }, { rejectWithValue, getState, dispatch }) => {
		const editor = (getState() as StateType).editors.editors[editorId];
		let toSend = editor && generateRequest(editor, prefs);

		if (msg) {
			toSend = generateMailRequest(msg);
		}

		let from = editor?.from?.address;
		if (!from && msg) {
			from = collectParticipantsFromMessage(msg, ParticipantRole.FROM)?.[0].address;
		}

		// Get the sender account. If not determined then undefined is passed to the soapFetch which will use the default one
		const account = getAddressOwnerAccount(from, getUserAccount(), getUserSettings());
		let resp;
		try {
			resp = (await soapFetch<SaveDraftRequest, SaveDraftResponse>(
				'SendMsg',
				{
					_jsns: 'urn:zimbraMail',
					m: toSend
				},
				account ?? undefined
			)) as SaveDraftResponse;
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
			dispatch(closeEditor(editorId));
		}
		if (response?.m && response?.m[0]?.cid) {
			dispatch(getConv({ conversationId: response.m[0].cid }));
		}
		return { response, editor };
	}
);
