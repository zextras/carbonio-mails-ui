/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { getUserSettings } from '@zextras/carbonio-shell-ui';
import { find, forEach, isEmpty, map } from 'lodash';
import { ParticipantRole } from '../../../carbonio-ui-commons/constants/participants';
import {
	InlineAttachments,
	MailsEditor,
	MailsEditorV2,
	Participant,
	SharedParticipant,
	SoapDraftMessageObj,
	SoapEmailMessagePartObj
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
 * @param editor
 */
export const createSoapDraftRequestFromEditor = (editor: MailsEditorV2): SoapDraftMessageObj => {
	//
	const participants: Array<Participant> = [
		...editor.recipients.to,
		...editor.recipients.cc,
		...editor.recipients.bcc
	];
	editor.from && participants.push(editor.from);

	if (editor.requestReadReceipt && editor.from) {
		participants.push({ ...editor.from, type: ParticipantRole.READ_RECEIPT_NOTIFICATION });
	}

	const soapParticipants = map(participants, (participant) => ({
		t: participant.type,
		a: participant.address,
		d: participant.fullName ?? participant.name
	}));

	return {
		autoSendTime: editor.autoSendTime,
		did: editor.did,
		attach: editor.attachments ?? { mp: [] }, // FIXME maybe attach should be optional
		su: { _content: editor.subject ?? '' },
		rt: editor.replyType,
		origid: editor.originalId,
		e: soapParticipants,
		mp: getMP(editor)
	};
};
