/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createSlice } from '@reduxjs/toolkit';
import { Account, AccountSettings } from '@zextras/carbonio-shell-ui';
import produce from 'immer';
import { drop } from 'lodash';
import { EditViewActions } from '../constants';
import { composeMailBodyWithSignature, getSignatureValue } from '../helpers/signatures';
import { normalizeMailMessageFromSoap } from '../normalizations/normalize-message';
import type {
	EditorsStateType,
	MailsEditorMap,
	MailsStateType,
	Participant,
	MailsEditor,
	MailMessage,
	SaveDraftNewParameters,
	saveDraftNewResult
} from '../types';
import { deleteAttachments } from './actions/delete-all-attachments';
import { saveDraft } from './actions/save-draft';
import {
	emptyEditor,
	extractBody,
	findAttachments,
	generateReplyText,
	retrieveAttachmentsType,
	retrieveBCC,
	retrieveCC,
	retrieveTO,
	retrieveALL,
	retrieveReplyTo,
	retrieveCCForEditNew
} from './editor-slice-utils';

type CreateEditorPayload = {
	editorId: string;
	original: MailMessage;
	id?: string;
	action: string | undefined;
	change?: string;
	accounts: Array<Account>;
	settings: AccountSettings;
	boardContext: Partial<{ compositionData: MailsEditor; contacts: Array<Participant> }>;
	labels: {
		to: string;
		from: string;
		cc: string;
		subject: string;
		sent: string;
	};
};

// Regex reply msg title
const REPLY_REGEX = /(^(re:\s)+)/i;

// Regex forward msg title
const FORWARD_REGEX = /(^(fwd:\s)+)/i;

function createEditorReducer(
	state: EditorsStateType,
	{ payload }: { payload: CreateEditorPayload }
): void {
	const empty = emptyEditor(payload.editorId, payload.accounts[0], payload.settings);

	state.editors[payload.editorId] = empty;

	const signatureRepliesForwardsValue = getSignatureValue(
		payload.accounts[0],
		String(payload.settings.prefs.zimbraPrefForwardReplySignatureId)
	);

	const textWithSignatureRepliesForwards =
		payload.labels && payload.original
			? [
					`${composeMailBodyWithSignature(signatureRepliesForwardsValue, false)} ${
						generateReplyText(payload.original, payload.labels)[0]
					}`,
					`${composeMailBodyWithSignature(signatureRepliesForwardsValue, true)} ${
						generateReplyText(payload.original, payload.labels)[1]
					}`
			  ]
			: ['', ''];

	if (payload.action) {
		const editorWithAction = { ...empty, action: payload.action };
		switch (payload.action) {
			case EditViewActions.NEW:
				state.editors[payload.editorId] = editorWithAction;
				break;
			case EditViewActions.MAIL_TO:
				if (payload?.boardContext?.contacts && payload?.boardContext?.contacts?.length > 0) {
					state.editors[payload.editorId] = {
						...editorWithAction,
						to: [payload.boardContext.contacts[0]],
						cc: drop(payload.boardContext.contacts, 1)
					};
				}

				break;
			case EditViewActions.EDIT_AS_DRAFT:
				if (payload.original) {
					state.editors[payload.editorId] = {
						...editorWithAction,
						id: payload.id,
						text: extractBody(payload.original),
						to: retrieveTO(payload.original),
						cc: retrieveCCForEditNew(payload.original),
						bcc: retrieveBCC(payload.original),
						subject: payload.original.subject,
						original: payload.original,
						attach: { mp: retrieveAttachmentsType(payload.original, 'attachment') },
						urgent: payload.original.urgent,
						attachmentFiles: findAttachments(payload.original.parts, [])
					};
				}

				break;
			case EditViewActions.EDIT_AS_NEW:
				if (payload.original) {
					state.editors[payload.editorId] = {
						...editorWithAction,
						id: payload.id,
						subject: payload.original.subject,
						attach: { mp: retrieveAttachmentsType(payload.original, 'attachment') },
						text: extractBody(payload.original),
						to: retrieveTO(payload.original),
						cc: retrieveCCForEditNew(payload.original),
						bcc: retrieveBCC(payload.original),
						original: payload.original,
						attachmentFiles: findAttachments(payload.original.parts, [])
					};
				}

				break;
			case EditViewActions.REPLY:
				if (payload.original) {
					state.editors[payload.editorId] = {
						...editorWithAction,
						id: payload.id,
						text: textWithSignatureRepliesForwards,
						to: retrieveReplyTo(payload.original),
						subject: `RE: ${payload.original.subject.replace(REPLY_REGEX, '')}`,
						original: payload.original,
						attach: { mp: retrieveAttachmentsType(payload.original, 'attachment') },
						urgent: payload.original.urgent,
						attachmentFiles: findAttachments(payload.original.parts, []),
						rt: 'r',
						origid: payload.original.id
					};
				}

				break;
			case EditViewActions.REPLY_ALL:
				if (payload.original && payload.accounts) {
					state.editors[payload.editorId] = {
						...editorWithAction,
						text: textWithSignatureRepliesForwards,
						to: retrieveALL(payload.original, payload.accounts),
						cc: retrieveCC(payload.original, payload.accounts),
						subject: `RE: ${payload.original.subject.replace(REPLY_REGEX, '')}`,
						original: payload.original,
						attach: { mp: retrieveAttachmentsType(payload.original, 'attachment') },
						urgent: payload.original.urgent,
						attachmentFiles: findAttachments(payload.original.parts, []),
						rt: 'r',
						origid: payload.original.id
					};
				}
				break;

			case EditViewActions.FORWARD:
				if (payload.original) {
					state.editors[payload.editorId] = {
						...editorWithAction,
						text: textWithSignatureRepliesForwards,
						subject: `FWD: ${payload.original.subject.replace(FORWARD_REGEX, '')}`,
						original: payload.original,
						attach: { mp: retrieveAttachmentsType(payload.original, 'attachment') },
						urgent: payload.original.urgent,
						attachmentFiles: findAttachments(payload.original.parts, []),
						rt: 'w',
						origid: payload.original.id
					};
				}
				break;
			case EditViewActions.COMPOSE:
				state.editors[payload.editorId] = {
					...editorWithAction,
					...(payload.boardContext?.compositionData ?? {})
				};
				break;
			case EditViewActions.PREFILL_COMPOSE:
				state.editors[payload.editorId] = {
					...editorWithAction,
					...(payload.boardContext?.compositionData ?? {})
				};
				break;
			default:
				console.warn('operation not handled!');
				break;
		}
	}
}

function closeEditorReducer(state: EditorsStateType, { payload }: { payload: string }): void {
	if (state.editors[payload]) delete state.editors[payload];
}

function closeAllEditorReducer(state: EditorsStateType): void {
	state.editors = {};
}
function deleteAttachmentsFulfilled(state: EditorsStateType, action: any): void {
	state.editors[action.meta.arg.id] = {
		...state.editors[action.meta.arg.id],
		attach: {
			mp: retrieveAttachmentsType(
				normalizeMailMessageFromSoap(action.payload.res.m[0], true),
				'attachment'
			)
		}
	};
}

function updateEditorReducer(
	state: EditorsStateType,
	{ payload }: { payload: { editorId: string | undefined; data: Partial<MailsEditor> } }
): void {
	if (payload.editorId && state.editors[payload?.editorId]) {
		state.editors[payload?.editorId] = {
			...state.editors[payload?.editorId],
			...payload.data
		};
	}
}
type saveDraftAction = {
	meta: {
		arg: SaveDraftNewParameters;
	};
	payload: saveDraftNewResult;
};

function saveDraftFulfilled(state: EditorsStateType, action: saveDraftAction): void {
	if (action.payload.resp.m) {
		// TODO move it to the new store (if needed)
		// const message = normalizeMailMessageFromSoap(action.payload.resp.m[0], true);
		// const mp = retrieveAttachmentsType(message, 'attachment');
		// state.editors[action.meta.arg.data.editorId] = {
		// 	...state.editors[action.meta.arg.data.editorId],
		// 	id: message.id,
		// 	attach: { mp },
		// 	oldId:
		// 		state.editors[action.meta.arg.data.editorId]?.oldId ??
		// 		state.editors[action.meta.arg.data.editorId]?.original?.id,
		// 	did: message.id,
		// 	attachmentFiles: findAttachments(message.parts, []),
		// 	original: message
		// };
	}
}

export const getEditorsSliceInitialState = (): EditorsStateType =>
	({
		status: 'idle',
		editors: {} as MailsEditorMap
	} as EditorsStateType);

export const editorsSlice = createSlice({
	name: 'editors',
	initialState: getEditorsSliceInitialState(),
	reducers: {
		createEditor: produce(createEditorReducer),
		closeEditor: produce(closeEditorReducer),
		updateEditor: produce(updateEditorReducer),
		closeAllEditors: produce(closeAllEditorReducer)
	},
	extraReducers: (builder) => {
		builder.addCase(saveDraft.fulfilled, produce(saveDraftFulfilled));
		builder.addCase(deleteAttachments.fulfilled, produce(deleteAttachmentsFulfilled));
	}
});

export const { createEditor, closeEditor, updateEditor } = editorsSlice.actions;

export const editorSliceReducer = editorsSlice.reducer;

export function selectEditors({ editors }: MailsStateType): MailsEditorMap {
	return editors ? editors.editors : {};
}
export const selectDraftId = (
	{ editors }: MailsStateType,
	id: string | undefined
): string | undefined =>
	id ? editors?.editors?.[id]?.id ?? editors?.editors?.[id]?.did : undefined;
