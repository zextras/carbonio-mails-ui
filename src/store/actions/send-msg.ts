/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createAsyncThunk } from '@reduxjs/toolkit';
import { soapFetch } from '@zextras/carbonio-shell-ui';
import { StateType, SaveDraftRequest, SaveDraftResponse, SendMsgParameters } from '../../types';
import { closeEditor } from '../editor-slice';
import { generateMailRequest, generateRequest } from '../editor-slice-utils';
import { getConv } from './get-conv';
import { getMsg } from './get-msg';

export const sendMsg = createAsyncThunk<any, SendMsgParameters>(
	'sendMsg',
	async ({ editorId, msg, prefs, otherAccount }, { rejectWithValue, getState, dispatch }) => {
		const editor = (getState() as StateType).editors.editors[editorId];
		let toSend = editor && generateRequest(editor, prefs);

		if (msg) {
			toSend = generateMailRequest(msg);
		}
		let resp;
		try {
			resp = (await soapFetch<SaveDraftRequest, SaveDraftResponse>(
				'SendMsg',
				{
					_jsns: 'urn:zimbraMail',
					m: toSend
				},
				otherAccount
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
