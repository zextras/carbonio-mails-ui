/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { BooleanString, getUserAccount, getUserSettings } from '@zextras/carbonio-shell-ui';
import { ParticipantRole } from '@zextras/carbonio-ui-commons';
import { filter, forEach, isEmpty, map, reduce } from 'lodash';

import { areContentIdsEqual, removeAngleBrackets } from 'commons/content-id-utils';
import { TINYMCE_BASE_CONTENT_STYLES } from 'constants/tinymce-content-styles';
import {
	composeAttachmentDownloadUrl,
	getCidFromCidUrl,
	isCidUrl,
	isDownloadServicedUrl
} from 'helpers/attachments';
import { getDefaultIdentity, getIdentityDescriptor, IdentityDescriptor } from 'helpers/identities';
import { applyUserPreferenceStyles } from 'helpers/user-preference-styles';
import {
	filterSavedInlineAttachment,
	filterSavedStandardAttachment,
	filterUnsavedInlineAttachment,
	filterUnsavedStandardAttachment
} from 'store/editor/editor-utils';
import { getCompleteMessageId } from 'store/utils';
import { SavedAttachment, UnsavedAttachment } from 'types/attachments';
import { MailsEditorV2 } from 'types/editor';
import { Participant } from 'types/participant';
import {
	MailAttachment,
	MailAttachmentParts,
	MsgAttach,
	SoapDraftMessageObj,
	SoapEmailMessagePartObj
} from 'types/soap/save-draft';

export const composeCidUrlFromContentId = (contentId: string): string | null => {
	const contentIdInnerPart = removeAngleBrackets(contentId);
	return contentIdInnerPart ? `cid:${contentIdInnerPart}` : null;
};

export const convertCidUrlToServiceUrl = (
	cidUrl: string,
	savedInlineAttachments: Array<SavedAttachment>
): string => {
	const cid = getCidFromCidUrl(cidUrl);
	if (!cid) {
		return cidUrl;
	}
	const referredAttachment = reduce<SavedAttachment, SavedAttachment | null>(
		savedInlineAttachments,
		(result, attachment) =>
			areContentIdsEqual(attachment.contentId ?? '', cid) ? attachment : result,
		null
	);

	if (!referredAttachment) {
		return cidUrl;
	}

	return composeAttachmentDownloadUrl(referredAttachment);
};

export const replaceCidUrlWithServiceUrl = (
	content: string,
	savedAttachment: Array<SavedAttachment>
): string => {
	const parser = new DOMParser();
	const htmlDoc = parser.parseFromString(content, 'text/html');
	const images = htmlDoc.getElementsByTagName('img');

	if (!images) {
		return content;
	}

	const someSrcChanged = reduce(
		images,
		(result, img): boolean => {
			const src = img.getAttribute('src');
			const pnsrc = img.getAttribute('pnsrc');
			const dataSrc = img.getAttribute('data-src');
			const dataMceSrc = img.getAttribute('data-mce-src');

			let referenceCid;
			if (pnsrc && isCidUrl(pnsrc)) {
				referenceCid = pnsrc;
			} else if (dataSrc && isCidUrl(dataSrc)) {
				referenceCid = dataSrc;
			} else if (dataMceSrc && isCidUrl(dataMceSrc)) {
				referenceCid = dataMceSrc;
			} else if (src && isCidUrl(src)) {
				referenceCid = src;
			}
			if (!referenceCid) {
				return false || result;
			}

			const newSrc = convertCidUrlToServiceUrl(referenceCid, savedAttachment);
			if (newSrc === src) {
				return false || result;
			}
			img.setAttribute('src', newSrc);
			img.setAttribute('pnsrc', referenceCid);
			img.setAttribute('data-src', referenceCid);
			img.setAttribute('data-mce-src', referenceCid);
			return true || result;
		},
		false
	);

	return someSrcChanged ? htmlDoc.body.innerHTML : content;
};

export const replaceServiceUrlWithCidUrl = (content: string): string => {
	const parser = new DOMParser();
	const htmlDoc = parser.parseFromString(content, 'text/html');
	const images = htmlDoc.getElementsByTagName('img');

	if (!images) {
		return content;
	}

	forEach(images, (p: HTMLImageElement) => {
		const src = p.getAttribute('src');
		if (!src || !isDownloadServicedUrl(src)) {
			return;
		}

		const pnsrc = p.getAttribute('pnsrc');
		const dataSrc = p.getAttribute('data-src');
		const dataMceSrc = p.getAttribute('data-mce-src');
		if (pnsrc && isCidUrl(pnsrc)) {
			p.setAttribute('src', pnsrc);
		} else if (dataSrc && isCidUrl(dataSrc)) {
			p.setAttribute('src', dataSrc);
		} else if (dataMceSrc && isCidUrl(dataMceSrc)) {
			p.setAttribute('src', dataMceSrc);
		}
	});

	return htmlDoc.body.innerHTML;
};

/**
 * @deprecated Use applyUserPreferenceStyles from helpers/user-preference-styles.ts instead
 * Wraps content with user preference styles applied via CSS, ensuring signature content is not affected.
 * @param content - The HTML content to wrap
 * @param style - User preference styles (font, fontSize, color)
 * @returns HTML content with inlined styles
 */
const getHtmlWithPreAppliedStyled = (
	content: string,
	style: { font: string | undefined; fontSize: string | undefined; color: string | undefined }
): string => applyUserPreferenceStyles(content, style, TINYMCE_BASE_CONTENT_STYLES);

export const getMP = (editor: MailsEditorV2): SoapEmailMessagePartObj[] => {
	const { prefs } = getUserSettings();

	// The stored text could be out of sync with the current text of the composer.
	// TODO: This logic should be encapsulated in the editor or the store
	const text = editor.textProvider?.getCurrentText() ?? editor.text;

	const style = {
		font: prefs?.zimbraPrefHtmlEditorDefaultFontFamily as string,
		fontSize: prefs?.zimbraPrefHtmlEditorDefaultFontSize as string,
		color: prefs?.zimbraPrefHtmlEditorDefaultFontColor as string
	};

	const unsavedInlineAttachment = filterUnsavedInlineAttachment(editor.unsavedAttachments);
	const savedInlineAttachment = filterSavedInlineAttachment(editor.savedAttachments);

	const contentWithCidUrl = {
		plainText: text?.plainText,
		richText: replaceServiceUrlWithCidUrl(text?.richText)
	};

	if (editor.isRichText) {
		if (unsavedInlineAttachment.length + savedInlineAttachment.length > 0) {
			return [
				{
					ct: 'multipart/alternative',
					mp: [
						{
							ct: 'text/plain',
							content: { _content: contentWithCidUrl.plainText }
						},
						{
							ct: 'multipart/related',
							mp: [
								{
									ct: 'text/html',
									content: {
										_content: getHtmlWithPreAppliedStyled(contentWithCidUrl.richText, style) ?? ''
									}
								},
								...savedInlineAttachment.map((inlineAttachment) => ({
									ci: inlineAttachment.contentId,
									ct: inlineAttachment.contentType,
									attach: {
										mp: [
											{
												mid: inlineAttachment.messageId,
												part: inlineAttachment.partName
											}
										]
									}
								})),
								// keep this order saved -> unsaved
								...unsavedInlineAttachment.map((inlineAttachment) => ({
									ci: inlineAttachment.contentId,
									ct: inlineAttachment.contentType,
									attach: { aid: inlineAttachment.aid }
								}))
							]
						}
					]
				}
			];
		}
		return [
			{
				ct: 'multipart/alternative',
				mp: [
					{
						ct: 'text/html',
						body: true,
						content: {
							_content: getHtmlWithPreAppliedStyled(contentWithCidUrl.richText, style) ?? ''
						}
					},
					{
						ct: 'text/plain',
						content: { _content: contentWithCidUrl.plainText }
					}
				]
			}
		];
	}
	return [
		{
			ct: 'text/plain',
			body: true,
			content: {
				_content: text?.plainText ?? ''
			}
		}
	];
};

/**
 *
 * @param identity
 * @param type
 */
const createParticipantFromIdentity = (
	identity: IdentityDescriptor,
	type: typeof ParticipantRole.FROM | typeof ParticipantRole.SENDER
): Participant =>
	({
		type,
		address: identity.fromAddress,
		name: identity.identityDisplayName,
		fullName: identity.fromDisplay
	}) as Participant;

/**
 *
 * @param identityId
 */
const createFromParticipantByIdentity = (identityId: string): Participant | null => {
	const identity = getIdentityDescriptor(identityId);
	if (!identity) {
		return null;
	}

	return createParticipantFromIdentity(identity, ParticipantRole.FROM);
};

/**
 *
 * @param identityId
 */
const createSenderParticipantByIdentity = (identityId: string): Participant | null => {
	const identity = getIdentityDescriptor(identityId);
	if (!identity) {
		return null;
	}

	if (identity.right === 'sendOnBehalfOf') {
		return createParticipantFromIdentity(getDefaultIdentity(), ParticipantRole.SENDER);
	}

	return null;
};

const composeAttachAidField = (attachments: Array<UnsavedAttachment>): string | null => {
	if (!attachments || !attachments.length) {
		return null;
	}
	return filter(attachments, (attachment) => attachment.aid !== undefined)
		.map((attachment) => attachment.aid)
		.join(',');
};

export const composeAttachMpField = (
	attachments: Array<SavedAttachment>
): Array<MailAttachmentParts> => {
	const result: Array<MailAttachmentParts> = [];
	attachments.forEach((attachment) => {
		result.push({
			mid: attachment.messageId,
			part: attachment.partName
		});
	});
	return result;
};

export const composeAttachMsgField = (attachments: Array<UnsavedAttachment>): Array<MsgAttach> =>
	attachments
		.filter((attachment) => attachment.mid)
		.map((attachment) => ({
			id: attachment.mid ?? ''
		}));

/*
 * Compose the "attach" field by listing the uploaded
 * files id in the "aid" field (comma separated) and
 * listing the previously saved attachment in the
 * "mp" field
 */
const composeAttachField = (editor: MailsEditorV2): MailAttachment | null => {
	const attachAid = composeAttachAidField(
		filterUnsavedStandardAttachment(editor.unsavedAttachments)
	);
	const attachMp = composeAttachMpField(filterSavedStandardAttachment(editor.savedAttachments));
	const attachMsgs = composeAttachMsgField(
		filterUnsavedStandardAttachment(editor.unsavedAttachments)
	);

	if (attachAid || attachMp?.length || attachMsgs?.length) {
		return {
			...(attachAid && { aid: attachAid }),
			mp: attachMp,
			m: attachMsgs
		};
	}
	return null;
};

function getReplyToAddress(identityId: string): string | undefined {
	const userAccount = getUserAccount();
	const foundIdentity = userAccount?.identities.identity.find(
		(identityVal) => identityVal.id === identityId
	);

	if (foundIdentity) {
		const { _attrs } = foundIdentity;
		const replyToEnabled = _attrs.zimbraPrefReplyToEnabled as BooleanString;
		const replyToAddress = _attrs.zimbraPrefReplyToAddress as string;
		if (replyToEnabled === 'TRUE' && !isEmpty(replyToAddress)) {
			return replyToAddress;
		}
	}
	return undefined;
}

/**
 *
 * @param editor
 * @param command
 */
const createSoapMessageRequestFromEditor = (
	editor: MailsEditorV2,
	command: 'sendmsg' | 'savedraft'
): SoapDraftMessageObj => {
	const participants: Array<Participant> = [
		...editor.recipients.to,
		...editor.recipients.cc,
		...editor.recipients.bcc
	];
	const from = createFromParticipantByIdentity(editor.identityId);
	const sender = createSenderParticipantByIdentity(editor.identityId);

	from && participants.push(from);
	sender && participants.push(sender);

	if (editor.requestReadReceipt && from) {
		participants.push({ ...from, type: ParticipantRole.READ_RECEIPT_NOTIFICATION });
	}

	const replyToAddress = getReplyToAddress(editor.identityId);
	if (replyToAddress) {
		participants.push({ address: replyToAddress, type: ParticipantRole.REPLY_TO });
	}

	const soapParticipants = map(participants, (participant) => ({
		t: participant.type,
		a: participant.address,
		p: participant.fullName ?? participant.name
	}));

	const draftMessage: SoapDraftMessageObj = {
		autoSendTime: editor.autoSendTime,
		...(command === 'savedraft' ? { id: editor.did } : {}),
		...(command === 'sendmsg' ? { did: editor.did } : {}),
		su: { _content: editor.subject ?? '' },
		rt: editor.replyType,
		...(editor.originalId ? { origid: getCompleteMessageId(editor.originalId) } : {}),
		e: soapParticipants,
		mp: getMP(editor),
		...(editor.isUrgent ? { f: '!' } : {})
	};

	const attach = composeAttachField(editor);
	attach && (draftMessage.attach = attach);
	return draftMessage;
};

export const createSoapDraftRequestFromEditor = (editor: MailsEditorV2): SoapDraftMessageObj =>
	createSoapMessageRequestFromEditor(editor, 'savedraft');

export const createSoapSendMsgRequestFromEditor = (editor: MailsEditorV2): SoapDraftMessageObj =>
	createSoapMessageRequestFromEditor(editor, 'sendmsg');
