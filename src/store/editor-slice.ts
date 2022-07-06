/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createSlice } from '@reduxjs/toolkit';
import { Account, AccountSettings } from '@zextras/carbonio-shell-ui';
import produce from 'immer';
import { drop, find } from 'lodash';
import { normalizeMailMessageFromSoap } from '../normalizations/normalize-message';
import { MailMessage } from '../types/mail-message';
import { MailsEditor } from '../types/mails-editor';
import { ActionsType, Participant } from '../types/participant';
import { EditorsStateType, MailsEditorMap, StateType } from '../types/state';
import { deleteAllAttachments } from './actions/delete-all-attachments';
import { saveDraft, SaveDraftNewParameters, saveDraftNewResult } from './actions/save-draft';
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
	retrieveCCForEditNew,
	getSignatures
} from './editor-slice-utils';

type CreateEditorPayload = {
	editorId: string;
	original: MailMessage;
	id?: string;
	action: string | undefined;
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

function createEditorReducer(
	state: EditorsStateType,
	{ payload }: { payload: CreateEditorPayload }
): void {
	const signatures = getSignatures(payload.accounts[0]);
	const empty = emptyEditor(payload.editorId, payload.accounts[0], payload.settings);

	state.editors[payload.editorId] = empty;

	const signatureRepliesForwardsValue =
		find(
			signatures,
			(signature: any) =>
				signature.value.id === payload.settings.prefs.zimbraPrefForwardReplySignatureId
		)?.value?.description ?? '';

	const textWithSignatureRepliesForwards =
		payload.labels && payload.original
			? [
					`<br>${signatureRepliesForwardsValue} ${
						generateReplyText(payload.original, payload.labels)[0]
					}`,
					`<br>${signatureRepliesForwardsValue} ${
						generateReplyText(payload.original, payload.labels)[1]
					}`
			  ]
			: ['', ''];

	if (payload.action) {
		switch (payload.action) {
			case ActionsType.NEW:
				state.editors[payload.editorId] = empty;
				break;
			case ActionsType.MAIL_TO:
				if (payload?.boardContext?.contacts && payload?.boardContext?.contacts?.length > 0) {
					state.editors[payload.editorId] = {
						...empty,
						to: [payload.boardContext.contacts[0]],
						cc: drop(payload.boardContext.contacts, 1)
					};
				}

				break;
			case ActionsType.EDIT_AS_DRAFT:
				if (payload.original) {
					state.editors[payload.editorId] = {
						...empty,
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
			case ActionsType.EDIT_AS_NEW:
				if (payload.original) {
					state.editors[payload.editorId] = {
						...empty,
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
			case ActionsType.REPLY:
				if (payload.original) {
					state.editors[payload.editorId] = {
						...empty,
						id: payload.id,
						text: textWithSignatureRepliesForwards,
						to: retrieveReplyTo(payload.original),
						subject: `RE: ${payload.original.subject}`,
						original: payload.original,
						attach: { mp: retrieveAttachmentsType(payload.original, 'attachment') },
						urgent: payload.original.urgent,
						attachmentFiles: findAttachments(payload.original.parts, []),
						rt: 'r',
						origid: payload.original.id
					};
				}

				break;
			case ActionsType.REPLY_ALL:
				if (payload.original && payload.accounts) {
					state.editors[payload.editorId] = {
						...empty,
						text: textWithSignatureRepliesForwards,
						to: retrieveALL(payload.original, payload.accounts),
						cc: retrieveCC(payload.original, payload.accounts),
						subject: `RE: ${payload.original.subject}`,
						original: payload.original,
						attach: { mp: retrieveAttachmentsType(payload.original, 'attachment') },
						urgent: payload.original.urgent,
						attachmentFiles: findAttachments(payload.original.parts, []),
						rt: 'r',
						origid: payload.original.id
					};
				}
				break;

			case ActionsType.FORWARD:
				if (payload.original) {
					state.editors[payload.editorId] = {
						...empty,
						text: textWithSignatureRepliesForwards,
						subject: `Fwd: ${payload.original.subject}`,
						original: payload.original,
						attach: { mp: retrieveAttachmentsType(payload.original, 'attachment') },
						urgent: payload.original.urgent,
						attachmentFiles: findAttachments(payload.original.parts, []),
						rt: 'w',
						origid: payload.original.id
					};
				}
				break;
			case ActionsType.COMPOSE:
				state.editors[payload.editorId] = {
					...empty,
					...(payload.boardContext?.compositionData ?? {})
				};
				break;
			case ActionsType.PREFILL_COMPOSE:
				state.editors[payload.editorId] = {
					...empty,
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
function deleteAllAttachmentsFulfilled(state: EditorsStateType, action: any): void {
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
	{ payload }: { payload: { editorId: string; data: MailsEditor } }
): void {
	if (state.editors[payload.editorId]) {
		state.editors[payload.editorId] = {
			...state.editors[payload.editorId],
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
	const message = normalizeMailMessageFromSoap(action.payload.resp.m[0], true);
	const mp = retrieveAttachmentsType(message, 'attachment');
	state.editors[action.meta.arg.data.editorId] = {
		...state.editors[action.meta.arg.data.editorId],
		id: message.id,
		attach: { mp },
		oldId:
			state.editors[action.meta.arg.data.editorId]?.oldId ??
			state.editors[action.meta.arg.data.editorId]?.original?.id,
		did: message.id,
		attachmentFiles: findAttachments(message.parts, []),
		original: message
	};
}

export const editorsSlice = createSlice({
	name: 'editors',
	initialState: {
		status: 'idle',
		editors: {} as MailsEditorMap
	} as EditorsStateType,
	reducers: {
		createEditor: produce(createEditorReducer),
		closeEditor: produce(closeEditorReducer),
		updateEditor: produce(updateEditorReducer),
		closeAllEditors: produce(closeAllEditorReducer)
	},
	extraReducers: (builder) => {
		builder.addCase(saveDraft.fulfilled, produce(saveDraftFulfilled));
		builder.addCase(deleteAllAttachments.fulfilled, produce(deleteAllAttachmentsFulfilled));
	}
});

export const { createEditor, closeEditor, updateEditor, closeAllEditors } = editorsSlice.actions;

export const editorSliceReducer = editorsSlice.reducer;

export function selectEditors({ editors }: StateType): MailsEditorMap {
	return editors ? editors.editors : {};
}
