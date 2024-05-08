/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { getUserSettings, t } from '@zextras/carbonio-shell-ui';
import { v4 as uuid } from 'uuid';

import { buildSavedAttachments, replaceCidUrlWithServiceUrl } from './editor-transformations';
import {
	computeDraftSaveAllowedStatus,
	computeSendAllowedStatus,
	filterSavedInlineAttachment
} from './editor-utils';
import { getEditor } from './hooks';
import { ParticipantRole } from '../../../carbonio-ui-commons/constants/participants';
import { getRootsMap } from '../../../carbonio-ui-commons/store/zustand/folder';
import { LineType } from '../../../commons/utils';
import { EditViewActions, NO_ACCOUNT_NAME } from '../../../constants';
import {
	getAddressOwnerAccount,
	getDefaultIdentity,
	getIdentityFromParticipant,
	getRecipientReplyIdentity
} from '../../../helpers/identities';
import { getFromParticipantFromMessage } from '../../../helpers/messages';
import { getMailBodyWithSignature } from '../../../helpers/signatures';
import {
	EditViewActionsType,
	EditorPrefillData,
	MailMessage,
	MailsEditorV2,
	UnsavedAttachment,
	Participant
} from '../../../types';
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
import { convertHtmlToPlainText } from '../../../carbonio-ui-commons/utils/text/html';

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
export const generateNewMessageEditor = (messagesStoreDispatch: AppDispatch): MailsEditorV2 => {
	const editorId = uuid();
	const text = {
		plainText: `\n\n${LineType.SIGNATURE_PRE_SEP}\n`,
		richText: `<p></p><br><div class="${LineType.SIGNATURE_CLASS}"></div>`
	};
	const defaultIdentity = getDefaultIdentity();
	const textWithSignature = getMailBodyWithSignature(text, defaultIdentity.defaultSignatureId);
	const isRichText = getUserSettings().prefs?.zimbraPrefComposeFormat === 'html';

	const editor = {
		action: EditViewActions.NEW,
		identityId: getDefaultIdentity().id,
		id: editorId,
		unsavedAttachments: [],
		savedAttachments: [],
		isRichText,
		isUrgent: false,
		recipients: {
			to: [],
			cc: [],
			bcc: []
		},
		subject: '',
		text: textWithSignature,
		requestReadReceipt: false,
		signatureId: defaultIdentity.defaultSignatureId,
		messagesStoreDispatch,
		size: 0,
		totalSmartLinksSize: 0
	} as MailsEditorV2;

	editor.draftSaveAllowedStatus = computeDraftSaveAllowedStatus(editor);
	editor.sendAllowedStatus = computeSendAllowedStatus(editor);
	return editor;
};

/**
 * Temporary type to keep backward compatibility with Calendars
 */
type InviteParticipant = {
	name: string;
	email: string;
	isOptional: boolean;
	response: string;
};

const isInviteParticipant = (participant: any): participant is InviteParticipant =>
	'name' in participant &&
	'email' in participant &&
	'isOptional' in participant &&
	'response' in participant;

const normalizeParticipant = (
	abstractParticipant: InviteParticipant | Partial<Participant>
): Participant => {
	const isParticipant = !isInviteParticipant(abstractParticipant);
	return {
		type: isParticipant && abstractParticipant.type ? abstractParticipant.type : ParticipantRole.TO,
		address:
			isParticipant && abstractParticipant.address
				? abstractParticipant.address
				: (abstractParticipant.email ?? ''),
		name: abstractParticipant.name,
		fullName: isParticipant ? abstractParticipant.fullName : abstractParticipant.name,
		email: abstractParticipant.email
	};
};

const normalizeParticipants = (
	abstractParticipants: Array<InviteParticipant | Partial<Participant>> | undefined
): Array<Participant> =>
	abstractParticipants
		? abstractParticipants.map((abstractParticipant) => normalizeParticipant(abstractParticipant))
		: [];

/**
 *
 */
export const generateIntegratedNewEditor = (
	messagesStoreDispatch: AppDispatch,
	compositionData?: EditorPrefillData
): MailsEditorV2 => {
	const editorId = uuid();

	const plainText = compositionData?.text?.[0] ?? `\n\n${LineType.SIGNATURE_PRE_SEP}\n`;
	const richText =
		compositionData?.text?.[1] ?? `<p></p><br><div class="${LineType.SIGNATURE_CLASS}"></div>`;

	const recipients = compositionData?.recipients
		? compositionData.recipients
		: normalizeParticipants(compositionData?.to);

	const text = {
		plainText,
		richText
	};
	const isRichText = getUserSettings().prefs?.zimbraPrefComposeFormat === 'html';
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
		isRichText,
		isUrgent: false,
		recipients: {
			to: recipients ?? [],
			cc: [],
			bcc: []
		},
		subject: compositionData?.subject ?? '',
		text: textWithSignature,
		requestReadReceipt: false,
		messagesStoreDispatch,
		size: 0,
		totalSmartLinksSize: 0,
		signatureId: defaultIdentity.defaultSignatureId
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
	originalMessage: MailMessage,
	action: EditViewActionsType
): MailsEditorV2 => {
	const editorId = uuid();
	const savedInlineAttachments = filterSavedInlineAttachment(
		buildSavedAttachments(originalMessage)
	);

	const text = {
		plainText: `\n\n${LineType.SIGNATURE_PRE_SEP}\n`,
		richText: `<p></p><br><div class="${LineType.SIGNATURE_CLASS}"></div>`
	};
	const folderRoots = getRootsMap();
	const from = getRecipientReplyIdentity(folderRoots, originalMessage);
	const defaultIdentity = getDefaultIdentity();
	const signatureId = from.identityId
		? from.forwardReplySignatureId
		: defaultIdentity.forwardReplySignatureId;
	const textWithSignature = getMailBodyWithSignature(text, signatureId);

	const textWithSignatureRepliesForwards = {
		plainText: `${textWithSignature.plainText} ${generateReplyText(originalMessage, labels)[0]}`,
		richText: replaceCidUrlWithServiceUrl(
			`${textWithSignature.richText} ${generateReplyText(originalMessage, labels)[1]}`,
			savedInlineAttachments
		)
	};
	const accountName = getAddressOwnerAccount(from.address) ?? NO_ACCOUNT_NAME;
	const isRichText = getUserSettings().prefs?.zimbraPrefComposeFormat === 'html';
	const toParticipants =
		action === EditViewActions.REPLY
			? retrieveReplyTo(originalMessage)
			: retrieveALL(originalMessage, accountName);

	const editor = {
		action: EditViewActions.REPLY,
		identityId: from.identityId ?? defaultIdentity.id,
		sender: undefined,
		id: editorId,
		unsavedAttachments: [],
		savedAttachments: savedInlineAttachments,
		isRichText,
		isUrgent: originalMessage.urgent,
		recipients: {
			to: toParticipants,
			cc: action === EditViewActions.REPLY_ALL ? retrieveCC(originalMessage, accountName) : [],
			bcc: []
		},
		subject: `RE: ${
			originalMessage.subject ? originalMessage.subject.replace(REPLY_REGEX, '') : ''
		}`,
		text: textWithSignatureRepliesForwards,
		requestReadReceipt: false,
		replyType: 'r',
		originalId: originalMessage.id,
		originalMessage,
		messagesStoreDispatch,
		size: originalMessage.size,
		totalSmartLinksSize: 0,
		signatureId
	} as MailsEditorV2;

	editor.draftSaveAllowedStatus = computeDraftSaveAllowedStatus(editor);
	editor.sendAllowedStatus = computeSendAllowedStatus(editor);

	return editor;
};

export const generateReplyMsgEditor = (
	messagesStoreDispatch: AppDispatch,
	originalMessage: MailMessage
): MailsEditorV2 =>
	generateReplyAndReplyAllMsgEditor(messagesStoreDispatch, originalMessage, EditViewActions.REPLY);

export const generateReplyAllMsgEditor = (
	messagesStoreDispatch: AppDispatch,
	originalMessage: MailMessage
): MailsEditorV2 =>
	generateReplyAndReplyAllMsgEditor(
		messagesStoreDispatch,
		originalMessage,
		EditViewActions.REPLY_ALL
	);
/**
 *
 */
export const generateForwardMsgEditor = (
	messagesStoreDispatch: AppDispatch,
	originalMessage: MailMessage
): MailsEditorV2 => {
	const editorId = uuid();
	const savedAttachments = buildSavedAttachments(originalMessage);

	const text = {
		plainText: `\n\n${LineType.SIGNATURE_PRE_SEP}\n`,
		richText: `<p></p><br><div class="${LineType.SIGNATURE_CLASS}"></div>`
	};
	const defaultIdentity = getDefaultIdentity();
	const folderRoots = getRootsMap();
	const from = getRecipientReplyIdentity(folderRoots, originalMessage);
	const signatureId = from.identityId
		? from.forwardReplySignatureId
		: defaultIdentity.forwardReplySignatureId;
	const textWithSignature = getMailBodyWithSignature(text, signatureId);
	const textWithSignatureRepliesForwards = {
		plainText: `${textWithSignature.plainText} ${generateReplyText(originalMessage, labels)[0]}`,
		richText: replaceCidUrlWithServiceUrl(
			`${textWithSignature.richText} ${generateReplyText(originalMessage, labels)[1]}`,
			savedAttachments
		)
	};
	const isRichText = getUserSettings().prefs?.zimbraPrefComposeFormat === 'html';
	const editor = {
		action: EditViewActions.REPLY,
		identityId: from.identityId ?? defaultIdentity.id,
		id: editorId,
		unsavedAttachments: [],
		savedAttachments,
		isRichText,
		isUrgent: originalMessage.urgent,
		recipients: {
			to: [],
			cc: [],
			bcc: []
		},
		subject: `FWD: ${
			originalMessage.subject ? originalMessage.subject.replace(FORWARD_REGEX, '') : ''
		}`,
		text: textWithSignatureRepliesForwards,
		requestReadReceipt: false,
		replyType: 'w',
		originalId: originalMessage.id,
		originalMessage,
		messagesStoreDispatch,
		size: originalMessage.size,
		totalSmartLinksSize: 0,
		signatureId
	} as MailsEditorV2;

	editor.draftSaveAllowedStatus = computeDraftSaveAllowedStatus(editor);
	editor.sendAllowedStatus = computeSendAllowedStatus(editor);

	return editor;
};

export const generateEditAsDraftEditor = (
	messagesStoreDispatch: AppDispatch,
	originalMessage: MailMessage
): MailsEditorV2 => {
	const editorId = uuid();
	const savedAttachments = buildSavedAttachments(originalMessage);
	const text = {
		plainText: `${convertHtmlToPlainText(extractBody(originalMessage)[0])}`,
		richText: replaceCidUrlWithServiceUrl(`${extractBody(originalMessage)[1]}`, savedAttachments)
	};

	const isRichText = getUserSettings().prefs?.zimbraPrefComposeFormat === 'html';
	const fromParticipant = getFromParticipantFromMessage(originalMessage);
	const fromIdentity = fromParticipant && getIdentityFromParticipant(fromParticipant);
	const editor = {
		action: EditViewActions.EDIT_AS_DRAFT,
		identityId: (fromIdentity ?? getDefaultIdentity()).id,
		id: editorId,
		unsavedAttachments: [],
		savedAttachments,
		isRichText,
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
		messagesStoreDispatch,
		size: originalMessage.size,
		totalSmartLinksSize: 0
	} as MailsEditorV2;

	editor.draftSaveAllowedStatus = computeDraftSaveAllowedStatus(editor);
	editor.sendAllowedStatus = computeSendAllowedStatus(editor);

	return editor;
};

export const generateEditAsNewEditor = (
	messagesStoreDispatch: AppDispatch,
	originalMessage: MailMessage
): MailsEditorV2 => {
	const editorId = uuid();
	const savedAttachments = buildSavedAttachments(originalMessage);

	const text = {
		plainText: `${convertHtmlToPlainText(extractBody(originalMessage)[0])}`,
		richText: replaceCidUrlWithServiceUrl(`${extractBody(originalMessage)[1]}`, savedAttachments)
	};
	const isRichText = getUserSettings().prefs?.zimbraPrefComposeFormat === 'html';
	const fromParticipant = getFromParticipantFromMessage(originalMessage);
	const fromIdentity = fromParticipant && getIdentityFromParticipant(fromParticipant);
	const editor = {
		action: EditViewActions.EDIT_AS_NEW,
		identityId: (fromIdentity ?? getDefaultIdentity()).id,
		id: editorId,
		unsavedAttachments: [],
		savedAttachments: buildSavedAttachments(originalMessage),
		isRichText,
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
		messagesStoreDispatch,
		size: originalMessage.size,
		totalSmartLinksSize: 0
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
	message?: MailMessage | null;
	compositionData?: EditorPrefillData;
};

/**
 * Generate a new editor structure for the given action and message id
 * @param action
 * @param id
 * @param messagesStoreDispatch
 * @param message
 */
export const generateEditor = ({
	action,
	id,
	messagesStoreDispatch,
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
			if (!id) {
				throw new Error('Cannot generate a reply editor without a message id');
			}
			if (message) {
				return generateReplyMsgEditor(messagesStoreDispatch, message);
			}
			break;
		case EditViewActions.REPLY_ALL:
			if (!id) {
				throw new Error('Cannot generate a reply all editor without a message id');
			}
			if (message) {
				return generateReplyAllMsgEditor(messagesStoreDispatch, message);
			}
			break;
		case EditViewActions.FORWARD:
			if (!id) {
				throw new Error('Cannot generate a forward editor without a message id');
			}
			if (message) {
				return generateForwardMsgEditor(messagesStoreDispatch, message);
			}
			break;
		case EditViewActions.EDIT_AS_DRAFT:
			if (!id) {
				throw new Error('Cannot generate a draft editor without a message id');
			}
			if (message) {
				return generateEditAsDraftEditor(messagesStoreDispatch, message);
			}
			break;
		case EditViewActions.EDIT_AS_NEW:
			if (!id) {
				throw new Error('Cannot generate an edit as new editor without a message id');
			}
			if (message) {
				return generateEditAsNewEditor(messagesStoreDispatch, message);
			}
			break;
		case EditViewActions.MAIL_TO:
		case EditViewActions.COMPOSE:
		case EditViewActions.PREFILL_COMPOSE:
			return generateIntegratedNewEditor(messagesStoreDispatch, compositionData);
		default:
			return null;
	}

	return null;
};
