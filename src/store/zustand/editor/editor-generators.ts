/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { v4 as uuid } from 'uuid';
import { EditViewActions, EditViewActionsType } from '../../../constants';
import { MailsEditorV2 } from '../../../types';
import { getEditor } from './hooks';

/**
 *
 */
const generateNewMessageEditor = (): MailsEditorV2 =>
	({
		attachmentFiles: [],
		from: undefined,
		id: uuid(),
		attachments: [],
		inlineAttachments: [],
		isRichText: false,
		isUrgent: false,
		recipients: {
			to: [],
			cc: [],
			bcc: []
		},
		subject: '',
		text: {
			plainText: '',
			richText: ''
		},
		requestReadReceipt: false,
		listeners: {
			draftSaveStartListeners: [],
			draftSaveEndListeners: []
		}
	} as MailsEditorV2);

/**
 *
 * @param editorId
 */
export const resumeEditor = (id: MailsEditorV2['id']): MailsEditorV2 | null => {
	const editor = getEditor({ id });
	return editor ?? null;
};

/**
 * Generate a new editor structure for the given action and message id
 * @param action - Edit action type
 * @param messageId - The id of the message associated with the action
 */
export const generateEditor = (
	action: EditViewActionsType,
	messageId?: string
): MailsEditorV2 | null => {
	switch (action) {
		case EditViewActions.RESUME:
			if (!messageId) {
				throw new Error('Cannot resume editor without an editor id');
			}
			break;
		case EditViewActions.NEW:
			// TODO
			return generateNewMessageEditor();
		case EditViewActions.REPLY:
			// TODO
			if (!messageId) {
				throw new Error('Cannot generate a reply editor without a message id');
			}
			break;
		case EditViewActions.REPLY_ALL:
			// TODO
			if (!messageId) {
				throw new Error('Cannot generate a reply all editor without a message id');
			}
			break;
		case EditViewActions.FORWARD:
			// TODO
			if (!messageId) {
				throw new Error('Cannot generate a forward editor without a message id');
			}
			break;
		case EditViewActions.EDIT_AS_DRAFT:
			// TODO
			if (!messageId) {
				throw new Error('Cannot generate a draft editor without a message id');
			}
			break;
		case EditViewActions.EDIT_AS_NEW:
			// TODO
			if (!messageId) {
				throw new Error('Cannot generate an edit as new editor without a message id');
			}
			break;
		case EditViewActions.MAIL_TO:
			// TODO
			break;
		case EditViewActions.COMPOSE:
			// TODO
			break;
		case EditViewActions.PREFILL_COMPOSE:
			// TODO
			break;
		default:
			return null;
	}

	return null;
};

// function createEditorReducer(
// 	state: EditorsStateType,
// 	{ payload }: { payload: CreateEditorPayload }
// ): void {
// 	const empty = emptyEditor(payload.editorId, payload.accounts[0], payload.settings);
//
// 	state.editors[payload.editorId] = empty;
//
// 	const signatureRepliesForwardsValue = getSignatureValue(
// 		payload.accounts[0],
// 		String(payload.settings.prefs.zimbraPrefForwardReplySignatureId)
// 	);
//
// 	const textWithSignatureRepliesForwards =
// 		payload.labels && payload.original
// 			? [
// 				`${composeMailBodyWithSignature(signatureRepliesForwardsValue, false)} ${
// 					generateReplyText(payload.original, payload.labels)[0]
// 				}`,
// 				`${composeMailBodyWithSignature(signatureRepliesForwardsValue, true)} ${
// 					generateReplyText(payload.original, payload.labels)[1]
// 				}`
// 			]
// 			: ['', ''];
//
// 	if (payload.action) {
// 		const editorWithAction = { ...empty, action: payload.action };
// 		switch (payload.action) {
// 			case EditViewActionsType.NEW:
// 				state.editors[payload.editorId] = editorWithAction;
// 				break;
// 			case EditViewActionsType.MAIL_TO:
// 				if (payload?.boardContext?.contacts && payload?.boardContext?.contacts?.length > 0) {
// 					state.editors[payload.editorId] = {
// 						...editorWithAction,
// 						to: [payload.boardContext.contacts[0]],
// 						cc: drop(payload.boardContext.contacts, 1)
// 					};
// 				}
//
// 				break;
// 			case EditViewActionsType.EDIT_AS_DRAFT:
// 				if (payload.original) {
// 					state.editors[payload.editorId] = {
// 						...editorWithAction,
// 						id: payload.id,
// 						text: extractBody(payload.original),
// 						to: retrieveTO(payload.original),
// 						cc: retrieveCCForEditNew(payload.original),
// 						bcc: retrieveBCC(payload.original),
// 						subject: payload.original.subject,
// 						original: payload.original,
// 						attach: { mp: retrieveAttachmentsType(payload.original, 'attachment') },
// 						urgent: payload.original.urgent,
// 						attachmentFiles: findAttachments(payload.original.parts, [])
// 					};
// 				}
//
// 				break;
// 			case EditViewActionsType.EDIT_AS_NEW:
// 				if (payload.original) {
// 					state.editors[payload.editorId] = {
// 						...editorWithAction,
// 						id: payload.id,
// 						subject: payload.original.subject,
// 						attach: { mp: retrieveAttachmentsType(payload.original, 'attachment') },
// 						text: extractBody(payload.original),
// 						to: retrieveTO(payload.original),
// 						cc: retrieveCCForEditNew(payload.original),
// 						bcc: retrieveBCC(payload.original),
// 						original: payload.original,
// 						attachmentFiles: findAttachments(payload.original.parts, [])
// 					};
// 				}
//
// 				break;
// 			case EditViewActionsType.REPLY:
// 				if (payload.original) {
// 					state.editors[payload.editorId] = {
// 						...editorWithAction,
// 						id: payload.id,
// 						text: textWithSignatureRepliesForwards,
// 						to: retrieveReplyTo(payload.original),
// 						subject: `RE: ${payload.original.subject.replace(REPLY_REGEX, '')}`,
// 						original: payload.original,
// 						attach: { mp: retrieveAttachmentsType(payload.original, 'attachment') },
// 						urgent: payload.original.urgent,
// 						attachmentFiles: findAttachments(payload.original.parts, []),
// 						rt: 'r',
// 						origid: payload.original.id
// 					};
// 				}
//
// 				break;
// 			case EditViewActionsType.REPLY_ALL:
// 				if (payload.original && payload.accounts) {
// 					state.editors[payload.editorId] = {
// 						...editorWithAction,
// 						text: textWithSignatureRepliesForwards,
// 						to: retrieveALL(payload.original, payload.accounts),
// 						cc: retrieveCC(payload.original, payload.accounts),
// 						subject: `RE: ${payload.original.subject.replace(REPLY_REGEX, '')}`,
// 						original: payload.original,
// 						attach: { mp: retrieveAttachmentsType(payload.original, 'attachment') },
// 						urgent: payload.original.urgent,
// 						attachmentFiles: findAttachments(payload.original.parts, []),
// 						rt: 'r',
// 						origid: payload.original.id
// 					};
// 				}
// 				break;
//
// 			case EditViewActionsType.FORWARD:
// 				if (payload.original) {
// 					state.editors[payload.editorId] = {
// 						...editorWithAction,
// 						text: textWithSignatureRepliesForwards,
// 						subject: `FWD: ${payload.original.subject.replace(FORWARD_REGEX, '')}`,
// 						original: payload.original,
// 						attach: { mp: retrieveAttachmentsType(payload.original, 'attachment') },
// 						urgent: payload.original.urgent,
// 						attachmentFiles: findAttachments(payload.original.parts, []),
// 						rt: 'w',
// 						origid: payload.original.id
// 					};
// 				}
// 				break;
// 			case EditViewActionsType.COMPOSE:
// 				state.editors[payload.editorId] = {
// 					...editorWithAction,
// 					...(payload.boardContext?.compositionData ?? {})
// 				};
// 				break;
// 			case EditViewActionsType.PREFILL_COMPOSE:
// 				state.editors[payload.editorId] = {
// 					...editorWithAction,
// 					...(payload.boardContext?.compositionData ?? {})
// 				};
// 				break;
// 			default:
// 				console.warn('operation not handled!');
// 				break;
// 		}
// 	}
// }
