/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { Account, AccountSettings, t } from '@zextras/carbonio-shell-ui';
import { v4 as uuid } from 'uuid';

import { buildSavedAttachments, replaceCidUrlWithServiceUrl } from './editor-transformations';
import {
	computeDraftSaveAllowedStatus,
	computeSendAllowedStatus,
	filterSavedInlineAttachment
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
import { EditViewActionsType, EditorPrefillData, MailMessage, MailsEditorV2, UnsavedAttachment } from '../../../types';
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

	const editor = {
		action: EditViewActions.NEW,
		identityId: getDefaultIdentity().id,
		id: editorId,
		unsavedAttachments: [],
		savedAttachments: [],
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
	const unsavedAttachments: Array<UnsavedAttachment> = !compositionData?.aid
		? []
		: compositionData.aid.map(
				(aid: string): UnsavedAttachment => ({
					isInline: false,
					aid,
					filename: 'unnamed',
					size: 0,
					contentType: 'application/octet-stream'
				})
		  );

	const editor = {
		action: EditViewActions.NEW,
		identityId: getDefaultIdentity().id,
		id: editorId,
		unsavedAttachments,
		savedAttachments: [],
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
	const savedInlineAttachments = filterSavedInlineAttachment(
		buildSavedAttachments(originalMessage)
	);

	const text = {
		plainText: `\n\n${LineType.SIGNATURE_PRE_SEP}\n`,
		richText: `<br/><br/><div class="${LineType.SIGNATURE_CLASS}"></div>`
	};
	const defaultIdentity = getDefaultIdentity();
	const textWithSignature = getMailBodyWithSignature(text, defaultIdentity.forwardReplySignatureId);

	const textWithSignatureRepliesForwards = {
		plainText: `${textWithSignature.plainText} ${generateReplyText(originalMessage, labels)[0]}`,
		richText: replaceCidUrlWithServiceUrl(
			`${textWithSignature.richText} ${generateReplyText(originalMessage, labels)[1]}`,
			savedInlineAttachments
		)
	};
	const folderRoots = getRootsMap();
	const from = getRecipientReplyIdentity(folderRoots, originalMessage);
	const toParticipants =
		action === EditViewActions.REPLY
			? retrieveReplyTo(originalMessage)
			: retrieveALL(originalMessage, [account]);

	const editor = {
		action: EditViewActions.REPLY,
		identityId: from.identityId,
		sender: undefined,
		id: editorId,
		unsavedAttachments: [],
		savedAttachments: savedInlineAttachments,
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
	originalMessage: MailMessage
): MailsEditorV2 => {
	const editorId = uuid();
	const savedAttachments = buildSavedAttachments(originalMessage);

	const text = {
		plainText: `\n\n${LineType.SIGNATURE_PRE_SEP}\n`,
		richText: `<br/><br/><div class="${LineType.SIGNATURE_CLASS}"></div>`
	};
	const defaultIdentity = getDefaultIdentity();
	const textWithSignature = getMailBodyWithSignature(text, defaultIdentity.forwardReplySignatureId);
	const textWithSignatureRepliesForwards = {
		plainText: `${textWithSignature.plainText} ${generateReplyText(originalMessage, labels)[0]}`,
		richText: replaceCidUrlWithServiceUrl(
			`${textWithSignature.richText} ${generateReplyText(originalMessage, labels)[1]}`,
			savedAttachments
		)
	};
	const folderRoots = getRootsMap();
	const from = getRecipientReplyIdentity(folderRoots, originalMessage);
	const editor = {
		action: EditViewActions.REPLY,
		identityId: from.identityId,
		id: editorId,
		unsavedAttachments: [],
		savedAttachments,
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

const generateEditAsDraftEditor = (
	messagesStoreDispatch: AppDispatch,
	account: Account,
	settings: AccountSettings,
	originalMessage: MailMessage
): MailsEditorV2 => {
	const editorId = uuid();
	const savedAttachments = buildSavedAttachments(originalMessage);

	const text = {
		plainText: `${extractBody(originalMessage)[0]}`,
		richText: replaceCidUrlWithServiceUrl(`${extractBody(originalMessage)[1]}`, savedAttachments)
	};
	const fromParticipant = getFromParticipantFromMessage(originalMessage);
	const fromIdentity = fromParticipant && getIdentityFromParticipant(fromParticipant);
	const editor = {
		action: EditViewActions.EDIT_AS_DRAFT,
		identityId: (fromIdentity ?? getDefaultIdentity()).id,
		id: editorId,
		unsavedAttachments: [],
		savedAttachments: buildSavedAttachments(originalMessage),
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
		did: originalMessage.id,
		messagesStoreDispatch
	} as MailsEditorV2;

	editor.draftSaveAllowedStatus = computeDraftSaveAllowedStatus(editor);
	editor.sendAllowedStatus = computeSendAllowedStatus(editor);

	return editor;
};

const generateEditAsNewEditor = (
	messagesStoreDispatch: AppDispatch,
	account: Account,
	settings: AccountSettings,
	originalMessage: MailMessage
): MailsEditorV2 => {
	const editorId = uuid();
	const savedAttachments = buildSavedAttachments(originalMessage);

	const text = {
		plainText: `${extractBody(originalMessage)[0]}`,
		richText: replaceCidUrlWithServiceUrl(`${extractBody(originalMessage)[1]}`, savedAttachments)
	};
	const fromParticipant = getFromParticipantFromMessage(originalMessage);
	const fromIdentity = fromParticipant && getIdentityFromParticipant(fromParticipant);
	const editor = {
		action: EditViewActions.EDIT_AS_NEW,
		identityId: (fromIdentity ?? getDefaultIdentity()).id,
		id: editorId,
		unsavedAttachments: [],
		savedAttachments: buildSavedAttachments(originalMessage),
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
				return generateEditAsDraftEditor(messagesStoreDispatch, account, settings, message);
			}
			break;
		case EditViewActions.EDIT_AS_NEW:
			// TODO
			if (!id) {
				throw new Error('Cannot generate an edit as new editor without a message id');
			}
			if (message) {
				return generateEditAsNewEditor(messagesStoreDispatch, account, settings, message);
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
