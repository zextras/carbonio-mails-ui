/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { getUserSettings } from '@zextras/carbonio-shell-ui';
import { find, forEach, map } from 'lodash';

import { ParticipantRole } from '../../../carbonio-ui-commons/constants/participants';
import {
	getDefaultIdentity,
	getIdentityDescriptor,
	IdentityDescriptor
} from '../../../helpers/identities';
import {
	InlineAttachments,
	MailAttachment,
	MailAttachmentParts,
	MailsEditorV2,
	Participant,
	SavedAttachment,
	SoapDraftMessageObj,
	SoapEmailMessagePartObj,
	UnsavedAttachment
} from '../../../types';

/**
 *
 * @param inline
 * @param part
 */
const findCidFromPart = (inline: InlineAttachments | undefined, part: string): string => {
	const ci = find(inline, (i) => i.attach?.mp?.[0]?.part === part)?.ci;
	return `cid:${ci}`;
};

/**
 *
 * @param content
 * @param inline
 */
const replaceLinkWithParts = (content: string, inline: InlineAttachments | undefined): string => {
	const parser = new DOMParser();
	const htmlDoc = parser.parseFromString(content, 'text/html');

	const images = htmlDoc.getElementsByTagName('img');

	if (images) {
		forEach(images, (p: HTMLImageElement) => {
			if (p.hasAttribute('src') && p.getAttribute('src')?.includes('/service/home')) {
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				const newSource = findCidFromPart(inline, p.getAttribute('src')?.split('&part=')[1]);
				p.setAttribute('src', newSource ?? '');
			}
		});
	}
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
	`<html><body><div style="font-family: ${style?.font}; font-size: ${style?.fontSize}; color: ${style?.color}">${content}</div></body></html>`;

export const getMP = (editor: MailsEditorV2): SoapEmailMessagePartObj[] => {
	const { prefs } = getUserSettings();

	const style = {
		font: prefs?.zimbraPrefHtmlEditorDefaultFontFamily as string,
		fontSize: prefs?.zimbraPrefHtmlEditorDefaultFontSize as string,
		color: prefs?.zimbraPrefHtmlEditorDefaultFontColor as string
	};
	const contentWithBodyParts = replaceLinkWithParts(
		editor.text.richText,
		editor?.inlineAttachments
	);
	if (editor.isRichText) {
		if (editor?.inlineAttachments && editor?.inlineAttachments?.length > 0) {
			return [
				{
					ct: 'multipart/alternative',
					mp: [
						{
							ct: 'text/plain',
							content: { _content: editor.text.plainText ?? '' }
						},
						{
							ct: 'multipart/related',
							mp: [
								{
									ct: 'text/html',
									content: {
										_content: getHtmlWithPreAppliedStyled(contentWithBodyParts, style) ?? ''
									}
								},
								...editor.inlineAttachments
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
						content: { _content: getHtmlWithPreAppliedStyled(editor.text.richText, style) ?? '' }
					},
					{
						ct: 'text/plain',
						content: { _content: editor.text.plainText ?? '' }
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
	return attachments.map((attachment) => attachment.aid).join(',');
};

const composeAttachMpField = (attachments: Array<SavedAttachment>): Array<MailAttachmentParts> => {
	const result: Array<MailAttachmentParts> = [];
	attachments.forEach((attachment) => {
		result.push({ mid: attachment.messageId, part: attachment.partName });
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
	const attachAid = composeAttachAidField(editor.unsavedAttachments);
	const attachMp = composeAttachMpField(editor.savedAttachments);

	if (!attachAid && !attachMp) {
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
 */
export const createSoapDraftRequestFromEditor = (editor: MailsEditorV2): SoapDraftMessageObj => {
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
		d: participant.fullName ?? participant.name
	}));

	const result: SoapDraftMessageObj = {
		autoSendTime: editor.autoSendTime,
		id: editor.did,
		su: { _content: editor.subject ?? '' },
		rt: editor.replyType,
		origid: editor.originalId,
		e: soapParticipants,
		mp: getMP(editor)
	};

	const attach = composeAttachField(editor);
	attach && (result.attach = attach);
	return result;
};
