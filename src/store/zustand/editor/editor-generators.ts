/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { Account, AccountSettings, t } from '@zextras/carbonio-shell-ui';
import { v4 as uuid } from 'uuid';

import { computeDraftSaveAllowedStatus, computeSendAllowedStatus } from './editor-utils';
import { getEditor } from './hooks';
import { ParticipantRole } from '../../../carbonio-ui-commons/constants/participants';
import { getRootsMap } from '../../../carbonio-ui-commons/store/zustand/folder';
import { LineType } from '../../../commons/utils';
import { EditViewActions, EditViewActionsType } from '../../../constants';
import { getDefaultIdentity, getRecipientReplyIdentity } from '../../../helpers/identities';
import { getMailBodyWithSignature } from '../../../helpers/signatures';
import { MailMessage, MailsEditorV2, MsgMap } from '../../../types';
import { createParticipantFromIdentity } from '../../../views/app/detail-panel/edit/edit-view-v2';
import {
	extractBody,
	generateReplyText,
	retrieveALL,
	retrieveBCC,
	retrieveCC,
	retrieveCCForEditNew,
	retrieveReplyTo,
	retrieveTO
} from '../../editor-slice-utils';
import { AppDispatch } from '../../redux';

// Regex reply msg title
const REPLY_REGEX = /(^(re:\s)+)/i;

// Regex forward msg title
const FORWARD_REGEX = /(^(fwd:\s)+)/i;

const labels = {
	to: `${t('label.to', 'To')}:`,
	from: `${t('label.from', 'From')}:`,
	cc: `${t('label.cc', 'CC')}:`,
	subject: `${t('label.subject', 'Subject')}:`,
	sent: `${t('label.sent', 'Sent')}:`
};

/**
 *
 */
const generateNewMessageEditor = (
	messagesStoreDispatch: AppDispatch,
	account: Account,
	settings: AccountSettings
): MailsEditorV2 => {
	const editorId = uuid();
	const text = {
		plainText: `\n\n${LineType.SIGNATURE_PRE_SEP}\n`,
		richText: `<br/><br/><div class="${LineType.SIGNATURE_CLASS}"></div>`
	};
	const defaultIdentity = getDefaultIdentity(account, settings);
	const textWithSignature = getMailBodyWithSignature(text, defaultIdentity.defaultSignatureId);
	const editor = {
		action: EditViewActions.NEW,
		attachmentFiles: [],
		from: createParticipantFromIdentity(
			getDefaultIdentity(account, settings),
			ParticipantRole.FROM
		),
		sender: undefined,
		id: editorId,
		// TODO: Need to manage the attachments
		attachments: { mp: [] },
		inlineAttachments: [],
		isRichText: true,
		isUrgent: false,
		recipients: {
			to: [],
			cc: [],
			bcc: []
		},
		subject: '',
		text: textWithSignature,
		requestReadReceipt: false,
		messagesStoreDispatch
	} as MailsEditorV2;

	editor.draftSaveAllowedStatus = computeDraftSaveAllowedStatus(editor);
	editor.sendAllowedStatus = computeSendAllowedStatus(editor);

	return editor;
};

/**
 *
 */
const generateReplyAndReplyAllMsgEditor = (
	messagesStoreDispatch: AppDispatch,
	account: Account,
	settings: AccountSettings,
	originalMessage: MailMessage,
	action: EditViewActionsType
): MailsEditorV2 => {
	const editorId = uuid();
	const text = {
		plainText: `\n\n${LineType.SIGNATURE_PRE_SEP}\n`,
		richText: `<br/><br/><div class="${LineType.SIGNATURE_CLASS}"></div>`
	};
	const defaultIdentity = getDefaultIdentity(account, settings);
	const textWithSignature = getMailBodyWithSignature(text, defaultIdentity.forwardReplySignatureId);

	const textWithSignatureRepliesForwards = {
		plainText: `${textWithSignature.plainText} ${generateReplyText(originalMessage, labels)[0]}`,
		richText: `${textWithSignature.richText} ${generateReplyText(originalMessage, labels)[1]}`
	};
	const folderRoots = getRootsMap();
	const from = getRecipientReplyIdentity(folderRoots, account, settings, originalMessage);
	const toParticipants =
		action === EditViewActions.REPLY
			? retrieveReplyTo(originalMessage)
			: retrieveALL(originalMessage, [account]);
	const editor = {
		action: EditViewActions.REPLY,
		attachmentFiles: [],
		from: {
			address: from.address,
			fullName: from.name,
			name: from.identityName,
			type: ParticipantRole.FROM
		},
		sender: undefined,
		id: editorId,
		// TODO: Need to manage the attachments
		attachments: { mp: [] },
		inlineAttachments: [],
		isRichText: true,
		isUrgent: originalMessage.urgent,
		recipients: {
			to: toParticipants,
			cc: action === EditViewActions.REPLY ? retrieveCC(originalMessage, [account]) : [],
			bcc: []
		},
		subject: `RE: ${originalMessage.subject.replace(REPLY_REGEX, '')}`,
		text: textWithSignatureRepliesForwards,
		requestReadReceipt: false,
		replyType: 'r',
		originalId: originalMessage.id,
		originalMessage,
		messagesStoreDispatch
	} as MailsEditorV2;

	editor.draftSaveAllowedStatus = computeDraftSaveAllowedStatus(editor);
	editor.sendAllowedStatus = computeSendAllowedStatus(editor);

	return editor;
};

/**
 *
 */
const generateForwardMsgEditor = (
	messagesStoreDispatch: AppDispatch,
	account: Account,
	settings: AccountSettings,
	originalMessage: MailMessage,
	action: EditViewActionsType
): MailsEditorV2 => {
	const editorId = uuid();
	const text = {
		plainText: `\n\n${LineType.SIGNATURE_PRE_SEP}\n`,
		richText: `<br/><br/><div class="${LineType.SIGNATURE_CLASS}"></div>`
	};
	const defaultIdentity = getDefaultIdentity(account, settings);
	const textWithSignature = getMailBodyWithSignature(text, defaultIdentity.forwardReplySignatureId);

	const textWithSignatureRepliesForwards = {
		plainText: `${textWithSignature.plainText} ${generateReplyText(originalMessage, labels)[0]}`,
		richText: `${textWithSignature.richText} ${generateReplyText(originalMessage, labels)[1]}`
	};
	const folderRoots = getRootsMap();
	const from = getRecipientReplyIdentity(folderRoots, account, settings, originalMessage);
	const editor = {
		action: EditViewActions.REPLY,
		attachmentFiles: [],
		from: {
			address: from.address,
			fullName: from.name,
			name: from.identityName,
			type: ParticipantRole.FROM
		},
		sender: undefined,
		id: editorId,
		// TODO: Need to manage the attachments
		attachments: { mp: [] },
		inlineAttachments: [],
		isRichText: true,
		isUrgent: originalMessage.urgent,
		recipients: {
			to: [],
			cc: [],
			bcc: []
		},
		subject: `FWD: ${originalMessage.subject.replace(FORWARD_REGEX, '')}`,
		text: textWithSignatureRepliesForwards,
		requestReadReceipt: false,
		replyType: 'w',
		originalId: originalMessage.id,
		originalMessage,
		messagesStoreDispatch
	} as MailsEditorV2;

	editor.draftSaveAllowedStatus = computeDraftSaveAllowedStatus(editor);
	editor.sendAllowedStatus = computeSendAllowedStatus(editor);

	return editor;
};

/**
 *
 */
const generateEditAsNewAndDraftEditor = (
	messagesStoreDispatch: AppDispatch,
	account: Account,
	settings: AccountSettings,
	originalMessage: MailMessage,
	action: EditViewActionsType
): MailsEditorV2 => {
	const editorId = uuid();
	const text = {
		plainText: `${extractBody(originalMessage)[0]}`,
		richText: `${extractBody(originalMessage)[1]}`
	};
	const folderRoots = getRootsMap();
	const from = getRecipientReplyIdentity(folderRoots, account, settings, originalMessage);
	const editor = {
		action: EditViewActions.REPLY,
		attachmentFiles: [],
		from: {
			address: from.address,
			fullName: from.name,
			name: from.identityName,
			type: ParticipantRole.FROM
		},
		sender: undefined,
		id: editorId,
		// TODO: Need to manage the attachments
		attachments: { mp: [] },
		inlineAttachments: [],
		isRichText: true,
		isUrgent: originalMessage.urgent,
		recipients: {
			to: retrieveTO(originalMessage),
			cc: retrieveCCForEditNew(originalMessage),
			bcc: retrieveBCC(originalMessage)
		},
		subject: originalMessage.subject,
		text,
		requestReadReceipt: false,
		originalId: originalMessage.id,
		originalMessage,
		messagesStoreDispatch
	} as MailsEditorV2;

	editor.draftSaveAllowedStatus = computeDraftSaveAllowedStatus(editor);
	editor.sendAllowedStatus = computeSendAllowedStatus(editor);

	return editor;
};

/**
 *
 * @param editorId
 */
export const resumeEditor = (id: MailsEditorV2['id']): MailsEditorV2 | null => {
	const editor = getEditor({ id });
	return editor ?? null;
};

export type GenerateEditorParams = {
	action: EditViewActionsType;
	id?: string;
	messagesStoreDispatch: AppDispatch;
	account: Account;
	settings: AccountSettings;
	messages?: MsgMap;
};

/**
 * Generate a new editor structure for the given action and message id
 * @param action - Edit action type
 * @param id - The id of the message or the editor associated with the action
 */
export const generateEditor = ({
	action,
	id,
	messagesStoreDispatch,
	account,
	settings,
	messages
}: GenerateEditorParams): MailsEditorV2 | null => {
	switch (action) {
		case EditViewActions.RESUME:
			if (!id) {
				throw new Error('Cannot resume editor without an editor id');
			}
			return getEditor({ id });
		case EditViewActions.NEW:
			return generateNewMessageEditor(messagesStoreDispatch, account, settings);
		case EditViewActions.REPLY:
			// TODO
			if (!id) {
				throw new Error('Cannot generate a reply editor without a message id');
			}
			if (messages && id && messages?.[id]) {
				return generateReplyAndReplyAllMsgEditor(
					messagesStoreDispatch,
					account,
					settings,
					messages?.[id] as MailMessage,
					action
				);
			}
			break;
		case EditViewActions.REPLY_ALL:
			// TODO
			if (!id) {
				throw new Error('Cannot generate a reply all editor without a message id');
			}
			if (messages && id && messages?.[id]) {
				return generateReplyAndReplyAllMsgEditor(
					messagesStoreDispatch,
					account,
					settings,
					messages?.[id] as MailMessage,
					action
				);
			}
			break;
		case EditViewActions.FORWARD:
			// TODO
			if (!id) {
				throw new Error('Cannot generate a forward editor without a message id');
			}
			if (messages && id && messages?.[id]) {
				return generateForwardMsgEditor(
					messagesStoreDispatch,
					account,
					settings,
					messages?.[id] as MailMessage,
					action
				);
			}
			break;
		case EditViewActions.EDIT_AS_DRAFT:
			// TODO
			if (!id) {
				throw new Error('Cannot generate a draft editor without a message id');
			}
			if (messages && id && messages?.[id]) {
				return generateEditAsNewAndDraftEditor(
					messagesStoreDispatch,
					account,
					settings,
					messages?.[id] as MailMessage,
					action
				);
			}
			break;
		case EditViewActions.EDIT_AS_NEW:
			// TODO
			if (!id) {
				throw new Error('Cannot generate an edit as new editor without a message id');
			}
			if (messages && id && messages?.[id]) {
				return generateEditAsNewAndDraftEditor(
					messagesStoreDispatch,
					account,
					settings,
					messages?.[id] as MailMessage,
					action
				);
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
