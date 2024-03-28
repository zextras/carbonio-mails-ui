/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { AccountSettingsPrefs, FOLDERS } from '@zextras/carbonio-shell-ui';
import { concat, filter, find, forEach, isEmpty, map, reduce, some } from 'lodash';
import moment from 'moment';

import {
	ParticipantRole,
	ParticipantRoleType
} from '../carbonio-ui-commons/constants/participants';
import { convertHtmlToPlainText } from '../carbonio-ui-commons/utils/text/html';
import { htmlEncode } from '../commons/get-quoted-text-util';
import { LineType } from '../commons/utils';
import { getAddressOwnerAccount, getIdentityDescriptor } from '../helpers/identities';
import type {
	InlineAttachments,
	MailAttachmentParts,
	MailMessage,
	MailMessagePart,
	MailsEditor,
	Participant,
	SharedParticipant,
	SoapDraftMessageObj
} from '../types';

export const retrieveAttachmentsType = (
	original: MailMessage,
	disposition: string
): Array<MailAttachmentParts> =>
	reduce(
		original?.parts?.[0]?.parts ?? [],
		(acc, part) =>
			part.disposition && part.disposition === disposition
				? [
						...acc,
						{
							part: part.name,
							mid: original.id,
							requiresSmartLinkConversion: !!part.requiresSmartLinkConversion
						}
				  ]
				: acc,
		[] as Array<MailAttachmentParts>
	);

export const retrieveFROM = (original: MailMessage): Array<Participant> =>
	filter(original.participants, (c: Participant): boolean => c.type === ParticipantRole.FROM);

export const changeParticipantRole = (
	original: MailMessage,
	previousRole: ParticipantRoleType,
	newRole: ParticipantRoleType
): Array<Participant> =>
	map(
		filter(original.participants, (c) => c.type === previousRole),
		(c) => ({ ...c, type: newRole })
	);

export const changeTypeOfParticipants = (
	participants: Array<Participant>,
	newRole: ParticipantRoleType
): Array<Participant> =>
	map(participants, (c: Participant): Participant => ({ ...c, type: newRole }));

export const retrieveReplyTo = (original: MailMessage): Array<Participant> => {
	const replyToParticipants = filter(
		original.participants,
		(c: Participant): boolean => c.type === ParticipantRole.REPLY_TO
	);
	if (replyToParticipants.length === 0) {
		if (original.parent === FOLDERS.SENT) {
			return filter(
				original.participants,
				(c: Participant): boolean => c.type === ParticipantRole.TO
			);
		}
		return changeParticipantRole(original, ParticipantRole.FROM, ParticipantRole.TO);
	}
	return changeParticipantRole(original, ParticipantRole.REPLY_TO, ParticipantRole.TO);
};

export const retrieveTO = (original: MailMessage): Array<Participant> =>
	filter(original.participants, (c: Participant): boolean => c.type === ParticipantRole.TO);

export function retrieveALL(
	original: MailMessage,
	replySenderAccountName: string
): Array<Participant> {
	const toEmails = filter(
		original.participants,
		(c: Participant): boolean => c.type === ParticipantRole.TO
	);
	const fromEmails = filter(
		original.participants,
		(c: Participant): boolean =>
			c.type === ParticipantRole.FROM &&
			replySenderAccountName !== getAddressOwnerAccount(c.address)
	);
	const replyToParticipants = filter(
		original.participants,
		(c: Participant): boolean => c.type === ParticipantRole.REPLY_TO
	);

	const isSentByMe = some(
		filter(original.participants, (c: Participant): boolean => c.type === ParticipantRole.FROM),
		(c: Participant): boolean => replySenderAccountName === getAddressOwnerAccount(c.address)
	);
	if (replyToParticipants.length === 0) {
		if (original.parent === FOLDERS.SENT || original.isSentByMe || isSentByMe) {
			return filter(toEmails, (c) => replySenderAccountName !== getAddressOwnerAccount(c.address))
				.length === 0
				? toEmails
				: filter(toEmails, (c) => replySenderAccountName !== getAddressOwnerAccount(c.address));
		}
		return changeTypeOfParticipants(fromEmails, ParticipantRole.TO);
	}
	return changeParticipantRole(original, ParticipantRole.REPLY_TO, ParticipantRole.TO);
}

export const retrieveCCForEditNew = (original: MailMessage): Array<Participant> =>
	filter(
		original.participants,
		(c: Participant): boolean => c.type === ParticipantRole.CARBON_COPY
	);

export function retrieveCC(
	original: MailMessage,
	replySenderAccountName: string
): Array<Participant> {
	const toEmails = filter(
		original.participants,
		(c: Participant): boolean =>
			c.type === ParticipantRole.TO && replySenderAccountName !== getAddressOwnerAccount(c.address)
	);
	const ccEmails = filter(
		original.participants,
		(c: Participant): boolean =>
			c.type === ParticipantRole.CARBON_COPY &&
			replySenderAccountName !== getAddressOwnerAccount(c.address)
	);
	const finalTo = retrieveALL(original, replySenderAccountName);
	const reducedCcEmails = reduce(
		ccEmails,
		(acc: Array<Participant>, v: Participant) => {
			if (
				!(toEmails.filter((x) => x.address === v.address).length > 0) &&
				!(finalTo.filter((x) => x.address === v.address).length > 0)
			) {
				acc.push({ ...v, type: ParticipantRole.CARBON_COPY });
			}
			return acc;
		},
		[]
	);
	if (original.parent !== FOLDERS.SENT && !original.isSentByMe) {
		return reduce(
			concat(toEmails, reducedCcEmails),
			(acc: Participant[], v: Participant) => {
				if (!(finalTo.filter((x) => x.address === v.address).length > 0))
					acc.push({ ...v, type: ParticipantRole.CARBON_COPY });
				return acc;
			},
			[]
		);
	}

	return changeTypeOfParticipants(reducedCcEmails, ParticipantRole.CARBON_COPY);
}

export const retrieveBCC = (original: MailMessage): Array<Participant> =>
	filter(
		original.participants,
		(c: Participant): boolean => c.type === ParticipantRole.BLIND_CARBON_COPY
	);

export function isHtml(parts: Array<MailMessagePart>): boolean {
	function subtreeContainsHtmlParts(part: MailMessagePart): boolean {
		if (part.contentType === 'text/html') return true;
		return part.parts ? part.parts.some(subtreeContainsHtmlParts) : false;
	}
	return parts?.some(subtreeContainsHtmlParts) || false;
}

export function findBodyPart(
	msgPart: Array<MailMessagePart>,
	content: string,
	acc2 = [] as Array<string>
): Array<string> {
	return reduce(
		msgPart,
		(acc, v) => {
			if (v.contentType === content && v.content) acc.push(v.content);
			return v.parts ? findBodyPart(v.parts, content, acc2) : acc2;
		},
		acc2 as Array<string>
	);
}

export const extractBody = (msg: MailMessage): Array<string> => {
	const textArr = findBodyPart(msg.parts, 'text/plain');
	const htmlArr = findBodyPart(msg.parts, 'text/html');
	const text = textArr.length ? textArr[0].replaceAll('\n', '<br/>') : undefined;
	const html = htmlArr.length ? htmlArr[0].replaceAll('dfsrc', 'src') : undefined;

	return [text ?? html ?? '', html ?? text ?? ''];
};

export function generateReplyText(
	mail: MailMessage,
	labels: { [k: string]: string }
): Array<string> {
	const headingFrom = map(
		filter(mail.participants, ['type', ParticipantRole.FROM]),
		(c) => `"${c.fullName}" <${c.address}>`
	).join(', ');

	const headingTo = map(
		filter(mail.participants, ['type', ParticipantRole.TO]),
		(c) => `"${c.fullName}" <${c.address}>`
	).join(', ');

	const headingCc = map(
		filter(mail.participants, ['type', ParticipantRole.CARBON_COPY]),
		(c) => `"${c.fullName}" <${c.address}>`
	).join(', ');

	const date = moment(mail.date).format('LLLL');

	const textToRetArray = [
		`\n\n${LineType.PLAINTEXT_SEP}\n${labels.from} ${headingFrom}\n${labels.to} ${headingTo}\n`,
		`<br /><br /><hr id="${
			LineType.HTML_SEP_ID
		}" ><div style="color: black; font-size: 12pt; font-family: tahoma, arial, helvetica, sans-serif;"><b>${
			labels.from
		}</b> ${htmlEncode(headingFrom)} <br /> <b>${labels.to}</b> ${htmlEncode(headingTo)} <br />`
	];

	if (headingCc.length > 0) {
		textToRetArray[1] += `<b>${labels.cc}</b> ${htmlEncode(headingCc)}<br />`;
		textToRetArray[0] += `${labels.cc} ${headingCc}\n`;
	}

	textToRetArray[1] += `<b>${labels.sent}</b> ${date} <br /> <b>${labels.subject}</b> ${htmlEncode(
		mail.subject
	)} <br /><br />${extractBody(mail)[1]}</div>`;

	textToRetArray[0] += `${labels.sent} ${date}\n${labels.subject} ${mail.subject}\n\n${
		extractBody(mail)[0]
	}`;

	return [convertHtmlToPlainText(textToRetArray[0]), textToRetArray[1]];
}

export const generateMailRequest = (msg: MailMessage): SoapDraftMessageObj => {
	const richText = extractBody(msg);
	const body = isHtml(msg.parts);
	return {
		id: msg.id === 'new' ? undefined : msg.id,
		did: msg.isDraft ? msg.did ?? msg.id : undefined,
		attach: { mp: retrieveAttachmentsType(msg, 'attachment') },
		su: { _content: msg.subject ?? '' },
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		e: map(msg.participants, (c) => ({
			t: c.type,
			a: c.address,
			d: (c as unknown as Participant).fullName ?? (c as unknown as Participant).name ?? undefined
		})),
		mp: [
			body
				? {
						ct: 'multipart/alternative',
						mp: [
							{
								ct: 'text/html',
								body: true,
								content: { _content: richText[1] ?? '' }
							},
							{
								ct: 'text/plain',
								content: { _content: richText[0] ?? '' }
							}
						]
				  }
				: {
						ct: 'text/plain',
						body: true,
						content: { _content: richText[0] ?? '' }
				  }
		]
	};
};

export const getHtmlWithPreAppliedStyled = (
	content: string,
	style: { font: string | undefined; fontSize: string | undefined; color: string | undefined }
): string =>
	`<html><body><div style="font-family: ${style?.font}; font-size: ${style?.fontSize}; color: ${style?.color}">${content}</div></body></html>`;

export const findCidFromPart = (inline: InlineAttachments | undefined, part: string): string => {
	const ci = find(inline, (i) => i.attach?.mp?.[0]?.part === part)?.ci;
	return `cid:${ci}`;
};
export const replaceLinkWithParts = (
	content: string,
	inline: InlineAttachments | undefined
): string => {
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

export const getMP = ({
	data,
	style
}: {
	data: MailsEditor;
	style: { font: string | undefined; fontSize: string | undefined; color: string | undefined };
}): any => {
	const contentWithBodyParts = replaceLinkWithParts(data?.text?.[1], data?.inline);
	if (data.richText) {
		if (data?.inline && data?.inline?.length > 0) {
			return [
				{
					ct: 'multipart/alternative',
					mp: [
						{
							ct: 'text/plain',
							content: { _content: data?.text[0] ?? '' }
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
								...data.inline
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
						content: { _content: getHtmlWithPreAppliedStyled(data?.text[1], style) ?? '' }
					},
					{
						ct: 'text/plain',
						content: { _content: data?.text[0] ?? '' }
					}
				]
			}
		];
	}
	return [
		{
			ct: 'text/plain',
			body: true,
			content: { _content: data?.text[0] ?? '' }
		}
	];
};

/**
 * @deprecated
 * @param data
 * @param prefs
 */
export const generateRequest = (
	// This function will be soon removed
	// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
	data: any,
	prefs?: Partial<AccountSettingsPrefs>
): SoapDraftMessageObj => {
	const style = {
		font: prefs?.zimbraPrefHtmlEditorDefaultFontFamily,
		fontSize: prefs?.zimbraPrefHtmlEditorDefaultFontSize,
		color: prefs?.zimbraPrefHtmlEditorDefaultFontColor
	};

	const from = getIdentityDescriptor(data.identityId)?.fromAddress;

	const participants = map(
		// eslint-disable-next-line no-nested-ternary
		data.recipients
			? data.recipients
			: isEmpty(data.sender)
			? [from, ...data.to, ...data.cc, ...data.bcc]
			: [from, data.sender, ...data.to, ...data.cc, ...data.bcc],
		(c) => ({
			t: c.type,
			a: c.email ?? c.address,
			d: c.fullName ?? c.firstName ?? undefined
		})
	);
	if (data.requestReadReceipt) {
		participants.push({
			a:
				(data?.sender as unknown as SharedParticipant)?.email ??
				(from as unknown as Participant)?.address,
			t: ParticipantRole.READ_RECEIPT_NOTIFICATION,
			d:
				(from as unknown as Participant).fullName ??
				(from as unknown as SharedParticipant).firstName ??
				undefined
		});
	}

	return {
		autoSendTime: data.autoSendTime,
		did: data.did,
		id: data.id ?? undefined,
		attach: data.attach,
		su: { _content: data.subject ?? '' },
		rt: data?.rt ?? undefined,
		origid: data?.origid ?? undefined,
		e: participants,
		mp: getMP({ data, style })
	};
};
