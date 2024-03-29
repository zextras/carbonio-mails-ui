/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { getUserSettings } from '@zextras/carbonio-shell-ui';
import { filter, forEach, map, reduce } from 'lodash';

import {
	filterSavedInlineAttachment,
	filterSavedStandardAttachment,
	filterUnsavedInlineAttachment,
	filterUnsavedStandardAttachment
} from './editor-utils';
import { ParticipantRole } from '../../../carbonio-ui-commons/constants/participants';
import {
	composeAttachmentDownloadUrl,
	extractContentIdInnerPart,
	getAttachmentParts,
	getCidFromCidUrl,
	isCidUrl,
	isContentIdEqual,
	isDownloadServicedUrl
} from '../../../helpers/attachments';
import {
	getDefaultIdentity,
	getIdentityDescriptor,
	IdentityDescriptor
} from '../../../helpers/identities';
import {
	MailAttachment,
	MailAttachmentParts,
	MailMessage,
	MailsEditorV2,
	Participant,
	SavedAttachment,
	SoapDraftMessageObj,
	SoapEmailMessagePartObj,
	UnsavedAttachment
} from '../../../types';

export const composeCidUrlFromContentId = (contentId: string): string | null => {
	const contentIdInnerPart = extractContentIdInnerPart(contentId);
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
			isContentIdEqual(attachment.contentId ?? '', cid) ? attachment : result,
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
 *
 * @param content
 * @param style
 */
const getHtmlWithPreAppliedStyled = (
	content: string,
	style: { font: string | undefined; fontSize: string | undefined; color: string | undefined }
): string =>
	`<html><style>p {margin:0};</style><body><div style="font-family: ${style?.font}; font-size: ${style?.fontSize}; color: ${style?.color}">${content}</div></body></html>`;

export const getMP = (editor: MailsEditorV2): SoapEmailMessagePartObj[] => {
	const { prefs } = getUserSettings();

	const style = {
		font: prefs?.zimbraPrefHtmlEditorDefaultFontFamily as string,
		fontSize: prefs?.zimbraPrefHtmlEditorDefaultFontSize as string,
		color: prefs?.zimbraPrefHtmlEditorDefaultFontColor as string
	};

	const unsavedInlineAttachment = filterUnsavedInlineAttachment(editor.unsavedAttachments);
	const savedInlineAttachment = filterSavedInlineAttachment(editor.savedAttachments);

	const contentWithCidUrl = {
		plainText: editor.text.plainText,
		richText: replaceServiceUrlWithCidUrl(editor.text.richText)
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
								...unsavedInlineAttachment.map((inlineAttachment) => ({
									ci: inlineAttachment.contentId,
									ct: inlineAttachment.contentType,
									attach: { aid: inlineAttachment.aid }
								})),
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
			content: { _content: editor.text.plainText ?? '' }
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
	} as Participant);

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

const composeAttachMpField = (attachments: Array<SavedAttachment>): Array<MailAttachmentParts> => {
	const result: Array<MailAttachmentParts> = [];
	attachments.forEach((attachment) => {
		result.push({
			mid: attachment.messageId,
			part: attachment.partName,
			requiresSmartLinkConversion: attachment.requiresSmartLinkConversion
		});
	});
	return result;
};

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

	if (!attachAid && (!attachMp || !attachMp.length)) {
		return null;
	}

	return {
		...(attachAid && { aid: attachAid }),
		mp: attachMp
	};
};

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

	const soapParticipants = map(participants, (participant) => ({
		t: participant.type,
		a: participant.address,
		p: participant.fullName ?? participant.name
	}));

	const result: SoapDraftMessageObj = {
		autoSendTime: editor.autoSendTime,
		...(command === 'savedraft' ? { id: editor.did } : {}),
		...(command === 'sendmsg' ? { did: editor.did } : {}),
		su: { _content: editor.subject ?? '' },
		rt: editor.replyType,
		origid: editor.originalId,
		e: soapParticipants,
		mp: getMP(editor),
		...(editor.isUrgent ? { f: '!' } : {})
	};

	const attach = composeAttachField(editor);
	attach && (result.attach = attach);
	return result;
};

export const createSoapDraftRequestFromEditor = (editor: MailsEditorV2): SoapDraftMessageObj =>
	createSoapMessageRequestFromEditor(editor, 'savedraft');

export const createSoapSendMsgRequestFromEditor = (editor: MailsEditorV2): SoapDraftMessageObj =>
	createSoapMessageRequestFromEditor(editor, 'sendmsg');

export const buildSavedAttachments = (message: MailMessage): Array<SavedAttachment> => {
	const attachmentsParts = getAttachmentParts(message.parts);
	return attachmentsParts.map<SavedAttachment>((part) => ({
		messageId: message.id,
		// TODO create a function to determine if the attachment is an inline even when the disposition is not set
		isInline: part.disposition === 'inline' && !!part.filename && !!part.ci,
		contentId: (part.ci && extractContentIdInnerPart(part.ci)) ?? undefined,
		filename: part.filename ?? '',
		partName: part.name,
		contentType: part.contentType,
		size: part.size,
		requiresSmartLinkConversion: part.requiresSmartLinkConversion
	}));
};
