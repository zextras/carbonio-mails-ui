/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { Account, AccountSettings, t } from '@zextras/carbonio-shell-ui';
import { v4 as uuid } from 'uuid';

import {
	computeAttachmentUploadAllowedStatus,
	computeDraftSaveAllowedStatus,
	computeSendAllowedStatus
} from './editor-utils';
import { getEditor } from './hooks';
import { getRootsMap } from '../../../carbonio-ui-commons/store/zustand/folder';
import { LineType } from '../../../commons/utils';
import { EditViewActions } from '../../../constants';
import {
	getDefaultIdentity,
	getIdentityFromParticipant,
	getRecipientReplyIdentity
} from '../../../helpers/identities';
import { getFromParticipantFromMessage } from '../../../helpers/messages';
import { getMailBodyWithSignature } from '../../../helpers/signatures';
import { EditorPrefillData, EditViewActionsType, MailMessage, MailsEditorV2 } from '../../../types';
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
const generateNewMessageEditor = (messagesStoreDispatch: AppDispatch): MailsEditorV2 => {
	const editorId = uuid();
	const text = {
		plainText: `\n\n${LineType.SIGNATURE_PRE_SEP}\n`,
		richText: `<br/><br/><div class="${LineType.SIGNATURE_CLASS}"></div>`
	};
	const defaultIdentity = getDefaultIdentity();
	const textWithSignature = getMailBodyWithSignature(text, defaultIdentity.defaultSignatureId);
	// const signature = getSignatureValue(account, defaultIdentity.defaultSignatureId ?? '');

	const editor = {
		action: EditViewActions.NEW,
		attachmentFiles: [],
		identityId: getDefaultIdentity().id,
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
		// signature,
		messagesStoreDispatch
	} as MailsEditorV2;

	editor.draftSaveAllowedStatus = computeDraftSaveAllowedStatus(editor);
	editor.sendAllowedStatus = computeSendAllowedStatus(editor);
	editor.attachmentsUploadStatus = computeAttachmentUploadAllowedStatus(editor);
	return editor;
};

/**
 *
 */
const generateIntegratedNewEditor = (
	messagesStoreDispatch: AppDispatch,
	compositionData?: EditorPrefillData
): MailsEditorV2 => {
	const editorId = uuid();
	const text = {
		plainText: `\n\n${LineType.SIGNATURE_PRE_SEP}\n`,
		richText: `<br/><br/><div class="${LineType.SIGNATURE_CLASS}"></div>`
	};
	const defaultIdentity = getDefaultIdentity();
	const textWithSignature = getMailBodyWithSignature(text, defaultIdentity.defaultSignatureId);
	const attachments = compositionData?.aid ? { aid: compositionData?.aid } : { mp: [] };

	const editor = {
		action: EditViewActions.NEW,
		attachmentFiles: [],
		identityId: getDefaultIdentity().id,
		id: editorId,
		// TODO: Need to manage the attachments
		attachments,
		inlineAttachments: [],
		isRichText: true,
		isUrgent: false,
		recipients: {
			to: compositionData?.recipients ? compositionData.recipients : [],
			cc: [],
			bcc: []
		},
		subject: '',
		text: textWithSignature,
		requestReadReceipt: false,
		// signature,
		messagesStoreDispatch
	} as MailsEditorV2;

	editor.draftSaveAllowedStatus = computeDraftSaveAllowedStatus(editor);
	editor.sendAllowedStatus = computeSendAllowedStatus(editor);
	editor.attachmentsUploadStatus = computeAttachmentUploadAllowedStatus(editor);
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
	const defaultIdentity = getDefaultIdentity();
	const textWithSignature = getMailBodyWithSignature(text, defaultIdentity.forwardReplySignatureId);

	const textWithSignatureRepliesForwards = {
		plainText: `${textWithSignature.plainText} ${generateReplyText(originalMessage, labels)[0]}`,
		richText: `${textWithSignature.richText} ${generateReplyText(originalMessage, labels)[1]}`
	};
	const folderRoots = getRootsMap();
	const from = getRecipientReplyIdentity(folderRoots, originalMessage);
	const toParticipants =
		action === EditViewActions.REPLY
			? retrieveReplyTo(originalMessage)
			: retrieveALL(originalMessage, [account]);
	const editor = {
		action: EditViewActions.REPLY,
		attachmentFiles: [],
		identityId: from.identityId,
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
	editor.attachmentsUploadStatus = computeAttachmentUploadAllowedStatus(editor);

	return editor;
};

/**
 *
 */
const generateForwardMsgEditor = (
	messagesStoreDispatch: AppDispatch,
	account: Account,
	settings: AccountSettings,
	originalMessage: MailMessage
): MailsEditorV2 => {
	const editorId = uuid();
	const text = {
		plainText: `\n\n${LineType.SIGNATURE_PRE_SEP}\n`,
		richText: `<br/><br/><div class="${LineType.SIGNATURE_CLASS}"></div>`
	};
	const defaultIdentity = getDefaultIdentity();
	const textWithSignature = getMailBodyWithSignature(text, defaultIdentity.forwardReplySignatureId);

	const textWithSignatureRepliesForwards = {
		plainText: `${textWithSignature.plainText} ${generateReplyText(originalMessage, labels)[0]}`,
		richText: `${textWithSignature.richText} ${generateReplyText(originalMessage, labels)[1]}`
	};
	const folderRoots = getRootsMap();
	const from = getRecipientReplyIdentity(folderRoots, originalMessage);
	const editor = {
		action: EditViewActions.REPLY,
		attachmentFiles: [],
		identityId: from.identityId,
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
	originalMessage: MailMessage
): MailsEditorV2 => {
	const editorId = uuid();
	const text = {
		plainText: `${extractBody(originalMessage)[0]}`,
		richText: `${extractBody(originalMessage)[1]}`
	};
	const fromParticipant = getFromParticipantFromMessage(originalMessage);
	const fromIdentity = fromParticipant && getIdentityFromParticipant(fromParticipant);
	const editor = {
		action: EditViewActions.REPLY,
		attachmentFiles: [],
		identityId: (fromIdentity ?? getDefaultIdentity()).id,
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
 * @param id
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
	message?: MailMessage | undefined;
	compositionData?: EditorPrefillData;
};

/**
 * Generate a new editor structure for the given action and message id
 * @param action
 * @param id
 * @param messagesStoreDispatch
 * @param account
 * @param settings
 * @param messages
 */
export const generateEditor = ({
	action,
	id,
	messagesStoreDispatch,
	account,
	settings,
	message,
	compositionData
}: GenerateEditorParams): MailsEditorV2 | null => {
	switch (action) {
		case EditViewActions.RESUME:
			if (!id) {
				throw new Error('Cannot resume editor without an editor id');
			}
			return getEditor({ id });
		case EditViewActions.NEW:
			return generateNewMessageEditor(messagesStoreDispatch);
		case EditViewActions.REPLY:
			// TODO
			if (!id) {
				throw new Error('Cannot generate a reply editor without a message id');
			}
			if (message) {
				return generateReplyAndReplyAllMsgEditor(
					messagesStoreDispatch,
					account,
					settings,
					message,
					action
				);
			}
			break;
		case EditViewActions.REPLY_ALL:
			// TODO
			if (!id) {
				throw new Error('Cannot generate a reply all editor without a message id');
			}
			if (message) {
				return generateReplyAndReplyAllMsgEditor(
					messagesStoreDispatch,
					account,
					settings,
					message,
					action
				);
			}
			break;
		case EditViewActions.FORWARD:
			// TODO
			if (!id) {
				throw new Error('Cannot generate a forward editor without a message id');
			}
			if (message) {
				return generateForwardMsgEditor(messagesStoreDispatch, account, settings, message);
			}
			break;
		case EditViewActions.EDIT_AS_DRAFT:
			// TODO
			if (!id) {
				throw new Error('Cannot generate a draft editor without a message id');
			}
			if (message) {
				return generateEditAsNewAndDraftEditor(messagesStoreDispatch, account, settings, message);
			}
			break;
		case EditViewActions.EDIT_AS_NEW:
			// TODO
			if (!id) {
				throw new Error('Cannot generate an edit as new editor without a message id');
			}
			if (message) {
				return generateEditAsNewAndDraftEditor(messagesStoreDispatch, account, settings, message);
			}
			break;
		case EditViewActions.MAIL_TO:
		case EditViewActions.PREFILL_COMPOSE:
			// TODO
			return generateIntegratedNewEditor(messagesStoreDispatch, compositionData);

			break;
		case EditViewActions.COMPOSE:
			// TODO
			break;
		// case EditViewActions.PREFILL_COMPOSE:
		// 	// TODO
		// 	return generateIntegratedNewEditor(messagesStoreDispatch, compositionData);
		// 	break;
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
