/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { getUserSettings, t } from '@zextras/carbonio-shell-ui';
import { ParticipantRole, getRootsMap } from '@zextras/carbonio-ui-commons';
import { v4 as uuid } from 'uuid';

import { buildSavedAttachments } from '../../helpers/attachments';
import { convertHtmlToPlainText } from 'commons/utilities';
import { EditViewActions, NO_ACCOUNT_NAME, PROCESS_STATUS } from 'constants/index';
import {
	getAddressOwnerAccount,
	getDefaultIdentity,
	getIdentityFromParticipant,
	getRecipientReplyIdentity
} from 'helpers/identities';
import { getFromParticipantFromMessage } from 'helpers/messages';
import { getMailBodyWithSignature } from 'helpers/signatures';
import { replaceCidUrlWithServiceUrl } from 'store/editor/editor-transformations';
import {
	computeDraftSaveAllowedStatus,
	computeSendAllowedStatus,
	filterSavedInlineAttachment
} from 'store/editor/editor-utils';
import { getEditor } from 'store/editor/hooks';
import {
	extractBody,
	generateReplyText,
	retrieveALL,
	retrieveBCC,
	retrieveCC,
	retrieveCCForEditNew,
	retrieveReplyTo,
	retrieveTO
} from 'store/editor-slice-utils';
import { UnsavedAttachment } from 'types/attachments';
import {
	EditorPrefillData,
	EditorRecipients,
	EditorText,
	EditViewActionsType,
	MailsEditorV2
} from 'types/editor';
import { MailMessage } from 'types/messages';
import { Participant } from 'types/participant';

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
// FIXME: this is a plain text editor and it is not clear, cleanup the generators or rename them
export const generateNewMessageEditor = (): MailsEditorV2 => {
	const editorId = uuid();
	const text = {
		plainText: ``,
		richText: ``
	};
	const defaultIdentity = getDefaultIdentity();
	const textWithSignature = getMailBodyWithSignature({
		editorText: text,
		newSignatureId: defaultIdentity.defaultSignatureId
	});
	const userSettings = getUserSettings();
	const prefs = userSettings?.prefs ?? {};
	const isRichText = prefs.zimbraPrefComposeFormat === 'html';
	const isRequestReadReceipt = prefs.zimbraPrefMailRequestReadReceipts === 'TRUE';

	const editor: MailsEditorV2 = {
		action: EditViewActions.NEW,
		identityId: getDefaultIdentity().id,
		id: editorId,
		unsavedAttachments: [],
		savedAttachments: [],
		isDirty: false,
		isRichText,
		isUrgent: false,
		recipients: {
			to: [],
			cc: [],
			bcc: []
		},
		subject: '',
		text: textWithSignature,
		requestReadReceipt: isRequestReadReceipt,
		signatureId: defaultIdentity.defaultSignatureId,

		size: 0
	};

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

const byType =
	(type: string) =>
	(participant: Participant): boolean =>
		participant.type === type;

function getMsgRecipients(compositionData?: EditorPrefillData): EditorRecipients {
	if (compositionData?.recipients) {
		return {
			to: compositionData.recipients.filter(byType(ParticipantRole.TO)),
			cc: compositionData.recipients.filter(byType(ParticipantRole.CARBON_COPY)),
			bcc: compositionData.recipients.filter(byType(ParticipantRole.BLIND_CARBON_COPY))
		};
	}

	if (compositionData?.to) {
		return {
			to: normalizeParticipants(compositionData.to),
			cc: [],
			bcc: []
		};
	}

	return {
		to: [],
		cc: [],
		bcc: []
	};
}

/**
 *
 */
export const generateIntegratedNewEditor = (compositionData?: EditorPrefillData): MailsEditorV2 => {
	const editorId = uuid();

	const plainText = compositionData?.text?.[0] ?? ``;
	const richText = compositionData?.text?.[1] ?? ``;

	const recipients = getMsgRecipients(compositionData);

	const text = {
		plainText,
		richText
	};
	const userSettings = getUserSettings();
	const prefs = userSettings?.prefs ?? {};
	const isRichText = prefs.zimbraPrefComposeFormat === 'html';
	const isRequestReadReceipt = prefs.zimbraPrefMailRequestReadReceipts === 'TRUE';
	const defaultIdentity = getDefaultIdentity();
	const textWithSignature = getMailBodyWithSignature({
		editorText: text,
		newSignatureId: defaultIdentity.defaultSignatureId
	});
	const unsavedAttachments: Array<UnsavedAttachment> =
		compositionData?.attachments?.map((att) => ({
			aid: att.aid,
			filename: att.filename,
			size: att.size,
			contentType: att.contentType,
			isInline: att.isInline ?? false
		})) ?? [];

	const editor: MailsEditorV2 = {
		action: EditViewActions.NEW,
		identityId: getDefaultIdentity().id,
		id: editorId,
		unsavedAttachments,
		savedAttachments: [],
		isDirty: false,
		isRichText,
		isUrgent: false,
		recipients,
		subject: compositionData?.subject ?? '',
		text: textWithSignature,
		requestReadReceipt: isRequestReadReceipt,
		size: 0,
		signatureId: defaultIdentity.defaultSignatureId
	};

	editor.draftSaveAllowedStatus = computeDraftSaveAllowedStatus(editor);
	editor.sendAllowedStatus = computeSendAllowedStatus(editor);
	return editor;
};

/**
 *
 */
const generateReplyAndReplyAllMsgEditor = (
	originalMessage: MailMessage,
	action: EditViewActionsType
): MailsEditorV2 => {
	const editorId = uuid();
	const savedInlineAttachments = filterSavedInlineAttachment(
		buildSavedAttachments(originalMessage)
	);

	const text = {
		plainText: ``,
		richText: ``
	};
	const folderRoots = getRootsMap();
	const from = getRecipientReplyIdentity(folderRoots, originalMessage);
	const defaultIdentity = getDefaultIdentity();
	const signatureId = from.identityId
		? from.forwardReplySignatureId
		: defaultIdentity.forwardReplySignatureId;
	const textWithSignature = getMailBodyWithSignature({
		editorText: text,
		newSignatureId: signatureId
	});
	const { richText: htmlQuotedReply, plainText: plainTextQuotedReply } = generateReplyText(
		originalMessage,
		labels
	);

	const richText = replaceCidUrlWithServiceUrl(
		`${textWithSignature.richText} ${htmlQuotedReply}`,
		savedInlineAttachments
	);

	const textWithSignatureRepliesForwards = {
		plainText: `${textWithSignature.plainText} ${plainTextQuotedReply}`,
		richText
	};
	const accountName = getAddressOwnerAccount(from.address) ?? NO_ACCOUNT_NAME;
	const userSettings = getUserSettings();
	const prefs = userSettings?.prefs ?? {};
	const isRichText = prefs.zimbraPrefComposeFormat === 'html';
	const isRequestReadReceipt = prefs.zimbraPrefMailRequestReadReceipts === 'TRUE';
	const toParticipants =
		action === EditViewActions.REPLY
			? retrieveReplyTo(originalMessage)
			: retrieveALL(originalMessage, accountName);

	const editor: MailsEditorV2 = {
		action: EditViewActions.REPLY,
		identityId: from.identityId ?? defaultIdentity.id,
		id: editorId,
		unsavedAttachments: [],
		savedAttachments: savedInlineAttachments,
		isDirty: false,
		isRichText,
		isUrgent: false,
		recipients: {
			to: toParticipants,
			cc: action === EditViewActions.REPLY_ALL ? retrieveCC(originalMessage, accountName) : [],
			bcc: []
		},
		subject: `RE: ${
			originalMessage.subject ? originalMessage.subject.replace(REPLY_REGEX, '') : ''
		}`,
		text: textWithSignatureRepliesForwards,
		requestReadReceipt: isRequestReadReceipt,
		replyType: 'r',
		originalId: originalMessage.id,
		originalMessage,
		size: originalMessage.size,
		signatureId
	};

	editor.draftSaveAllowedStatus = computeDraftSaveAllowedStatus(editor);
	editor.sendAllowedStatus = computeSendAllowedStatus(editor);

	return editor;
};

export const generateReplyMsgEditor = (originalMessage: MailMessage): MailsEditorV2 =>
	generateReplyAndReplyAllMsgEditor(originalMessage, EditViewActions.REPLY);

export const generateReplyAllMsgEditor = (originalMessage: MailMessage): MailsEditorV2 =>
	generateReplyAndReplyAllMsgEditor(originalMessage, EditViewActions.REPLY_ALL);
/**
 *
 */
export const generateForwardMsgEditor = (originalMessage: MailMessage): MailsEditorV2 => {
	const editorId = uuid();
	const savedAttachments = buildSavedAttachments(originalMessage);

	const text = {
		plainText: ``,
		richText: ``
	};
	const defaultIdentity = getDefaultIdentity();
	const folderRoots = getRootsMap();
	const from = getRecipientReplyIdentity(folderRoots, originalMessage);
	const signatureId = from.identityId
		? from.forwardReplySignatureId
		: defaultIdentity.forwardReplySignatureId;
	const textWithSignature = getMailBodyWithSignature({
		editorText: text,
		newSignatureId: signatureId
	});
	const textWithSignatureRepliesForwards = {
		plainText: `${textWithSignature.plainText} ${convertHtmlToPlainText(generateReplyText(originalMessage, labels).richText)}`,
		richText: replaceCidUrlWithServiceUrl(
			`${textWithSignature.richText} ${generateReplyText(originalMessage, labels).richText}`,
			savedAttachments
		)
	};
	const userSettings = getUserSettings();
	const prefs = userSettings?.prefs ?? {};
	const isRichText = prefs.zimbraPrefComposeFormat === 'html';
	const isRequestReadReceipt = prefs.zimbraPrefMailRequestReadReceipts === 'TRUE';
	const editor: MailsEditorV2 = {
		action: EditViewActions.FORWARD,
		identityId: from.identityId ?? defaultIdentity.id,
		id: editorId,
		unsavedAttachments: [],
		savedAttachments,
		isDirty: false,
		isRichText,
		isUrgent: false,
		recipients: {
			to: [],
			cc: [],
			bcc: []
		},
		subject: `FWD: ${
			originalMessage.subject ? originalMessage.subject.replace(FORWARD_REGEX, '') : ''
		}`,
		text: textWithSignatureRepliesForwards,
		requestReadReceipt: isRequestReadReceipt,
		replyType: 'w',
		originalId: originalMessage.id,
		originalMessage,
		size: originalMessage.size,
		signatureId
	};

	editor.draftSaveAllowedStatus = computeDraftSaveAllowedStatus(editor);
	editor.sendAllowedStatus = computeSendAllowedStatus(editor);

	return editor;
};

export const generateForwardAsAttachmentMsgEditor = (
	originalMessage: MailMessage,
	attachments: Array<UnsavedAttachment>
): MailsEditorV2 => {
	const editorId = uuid();

	const text = {
		plainText: ``,
		richText: ``
	};
	const defaultIdentity = getDefaultIdentity();
	const folderRoots = getRootsMap();
	const from = getRecipientReplyIdentity(folderRoots, originalMessage);
	const signatureId = from.identityId
		? from.forwardReplySignatureId
		: defaultIdentity.forwardReplySignatureId;
	const textWithSignature = getMailBodyWithSignature({
		editorText: text,
		newSignatureId: signatureId
	});
	const textWithSignatureRepliesForwards = {
		plainText: `${textWithSignature.plainText}`,
		richText: `${textWithSignature.richText}`
	};
	const userSettings = getUserSettings();
	const prefs = userSettings?.prefs ?? {};
	const isRichText = prefs.zimbraPrefComposeFormat === 'html';
	const isRequestReadReceipt = prefs.zimbraPrefMailRequestReadReceipts === 'TRUE';
	const editor: MailsEditorV2 = {
		action: EditViewActions.FORWARD_AS_ATTACHMENT,
		identityId: from.identityId ?? defaultIdentity.id,
		id: editorId,
		unsavedAttachments: attachments,
		savedAttachments: [],
		isDirty: false,
		isRichText,
		isUrgent: false,
		recipients: {
			to: [],
			cc: [],
			bcc: []
		},
		subject: `FWD: ${
			originalMessage.subject ? originalMessage.subject.replace(FORWARD_REGEX, '') : ''
		}`,
		text: textWithSignatureRepliesForwards,
		requestReadReceipt: isRequestReadReceipt,
		replyType: 'w',
		originalId: originalMessage.id,
		originalMessage,
		size: originalMessage.size,
		signatureId
	};

	editor.draftSaveAllowedStatus = computeDraftSaveAllowedStatus(editor);
	editor.sendAllowedStatus = computeSendAllowedStatus(editor);

	return editor;
};

export const generateEditAsDraftEditor = (originalMessage: MailMessage): MailsEditorV2 => {
	const editorId = uuid();
	const savedAttachments = buildSavedAttachments(originalMessage);
	const richText = replaceCidUrlWithServiceUrl(
		`${extractBody(originalMessage).richText}`,
		savedAttachments
	);
	const text: EditorText = {
		plainText: convertHtmlToPlainText(richText),
		richText
	};
	const userSettings = getUserSettings();
	const prefs = userSettings?.prefs ?? {};
	const isRichText = prefs.zimbraPrefComposeFormat === 'html';
	const isRequestReadReceipt = prefs.zimbraPrefMailRequestReadReceipts === 'TRUE';
	const fromParticipant = getFromParticipantFromMessage(originalMessage);
	const fromIdentity = fromParticipant && getIdentityFromParticipant(fromParticipant);
	const draftSaveProcessStatus = {
		status: PROCESS_STATUS.COMPLETED,
		lastSaveTimestamp: new Date(originalMessage.date)
	};
	const editor: MailsEditorV2 = {
		action: EditViewActions.EDIT_AS_DRAFT,
		identityId: (fromIdentity ?? getDefaultIdentity()).id,
		id: editorId,
		originalId: originalMessage.originalId,
		replyType: originalMessage.replyType,
		unsavedAttachments: [],
		savedAttachments,
		isDirty: false,
		isRichText,
		isUrgent: !!originalMessage.urgent,
		recipients: {
			to: retrieveTO(originalMessage),
			cc: retrieveCCForEditNew(originalMessage),
			bcc: retrieveBCC(originalMessage)
		},
		subject: originalMessage.subject,
		text,
		requestReadReceipt: isRequestReadReceipt,
		did: originalMessage.id,
		size: originalMessage.size,
		originalMessage,
		draftSaveProcessStatus
	};

	editor.draftSaveAllowedStatus = computeDraftSaveAllowedStatus(editor);
	editor.sendAllowedStatus = computeSendAllowedStatus(editor);

	return editor;
};

export const generateEditAsNewEditor = (originalMessage: MailMessage): MailsEditorV2 => {
	const editorId = uuid();
	const savedAttachments = buildSavedAttachments(originalMessage);

	const richText = replaceCidUrlWithServiceUrl(
		`${extractBody(originalMessage).richText}`,
		savedAttachments
	);
	const text = {
		plainText: convertHtmlToPlainText(richText),
		richText
	};
	const userSettings = getUserSettings();
	const prefs = userSettings?.prefs ?? {};
	const isRichText = prefs.zimbraPrefComposeFormat === 'html';
	const isRequestReadReceipt = prefs.zimbraPrefMailRequestReadReceipts === 'TRUE';
	const fromParticipant = getFromParticipantFromMessage(originalMessage);
	const fromIdentity = fromParticipant && getIdentityFromParticipant(fromParticipant);
	const editor: MailsEditorV2 = {
		action: EditViewActions.EDIT_AS_NEW,
		identityId: (fromIdentity ?? getDefaultIdentity()).id,
		id: editorId,
		unsavedAttachments: [],
		savedAttachments: buildSavedAttachments(originalMessage),
		isDirty: false,
		isRichText,
		isUrgent: false,
		recipients: {
			to: retrieveTO(originalMessage),
			cc: retrieveCCForEditNew(originalMessage),
			bcc: retrieveBCC(originalMessage)
		},
		subject: originalMessage.subject
			? originalMessage.subject.replace(REPLY_REGEX, '').replace(FORWARD_REGEX, '')
			: '',
		text,
		requestReadReceipt: isRequestReadReceipt,
		originalMessage,
		size: originalMessage.size
	};

	editor.draftSaveAllowedStatus = computeDraftSaveAllowedStatus(editor);
	editor.sendAllowedStatus = computeSendAllowedStatus(editor);

	return editor;
};

export type GenerateEditorParams = {
	action: EditViewActionsType;
	id?: string;
	message?: MailMessage | null;
	compositionData?: EditorPrefillData;
};

export const resumeEditor = (id: string): MailsEditorV2 | null => {
	const editor = getEditor({ id });
	return editor ?? null;
};

/**
 * Generate a new editor structure for the given action and message id
 * @param action
 * @param id
 * @param message
 */
export const generateEditor = ({
	action,
	id,
	message,
	compositionData
}: GenerateEditorParams): MailsEditorV2 | null => {
	switch (action) {
		case EditViewActions.NEW:
			return generateNewMessageEditor();
		case EditViewActions.REPLY:
			if (!id) {
				throw new Error('Cannot generate a reply editor without a message id');
			}
			if (message) {
				return generateReplyMsgEditor(message);
			}
			break;
		case EditViewActions.REPLY_ALL:
			if (!id) {
				throw new Error('Cannot generate a reply all editor without a message id');
			}
			if (message) {
				return generateReplyAllMsgEditor(message);
			}
			break;
		case EditViewActions.FORWARD:
			if (!id) {
				throw new Error('Cannot generate a forward editor without a message id');
			}
			if (message) {
				return generateForwardMsgEditor(message);
			}
			break;
		case EditViewActions.FORWARD_AS_ATTACHMENT:
			if (!id) {
				throw new Error('Cannot generate a forward editor without a message id');
			}
			if (message) {
				return generateForwardAsAttachmentMsgEditor(message, compositionData?.attachments ?? []);
			}
			break;
		case EditViewActions.EDIT_AS_DRAFT:
			if (!id) {
				throw new Error('Cannot generate a draft editor without a message id');
			}
			if (message) {
				return generateEditAsDraftEditor(message);
			}
			break;
		case EditViewActions.EDIT_AS_NEW:
			if (!id) {
				throw new Error('Cannot generate an edit as new editor without a message id');
			}
			if (message) {
				return generateEditAsNewEditor(message);
			}
			break;
		case EditViewActions.MAIL_TO:
		case EditViewActions.COMPOSE:
		case EditViewActions.PREFILL_COMPOSE:
			return generateIntegratedNewEditor(compositionData);
		default:
			return null;
	}

	return null;
};
