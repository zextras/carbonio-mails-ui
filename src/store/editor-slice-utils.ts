/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { map, filter, reduce, concat, isEmpty, find, some } from 'lodash';
import { Account, AccountSettings, FOLDERS } from '@zextras/carbonio-shell-ui';
import moment from 'moment';
import {
	EditorAttachmentFiles,
	MailsEditor,
	MailMessage,
	MailMessagePart,
	Participant,
	SharedParticipant,
	mailAttachmentParts,
	SoapDraftMessageObj
} from '../types';
import { ParticipantRole } from '../commons/utils';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const retrieveAttachmentsType = (
	original: MailMessage,
	disposition: string
): Array<mailAttachmentParts> =>
	reduce(
		original?.parts?.[0]?.parts ?? [],
		(acc, part) =>
			part.disposition && part.disposition === disposition
				? [...acc, { part: part.name, mid: original.id }]
				: acc,
		[] as Array<mailAttachmentParts>
	);

export const getSignatures: any = (account: any, t: any) => {
	const signatureArray = [
		{
			label: 'No signature',
			value: { description: '', id: '11111111-1111-1111-1111-111111111111' }
		}
	];
	map(account.signatures.signature, (item) =>
		signatureArray.push({
			label: item.name,
			value: { description: item.content ? item.content[0]._content : '', id: item?.id }
		})
	);
	return signatureArray;
};

export const emptyEditor = (
	editorId: string,
	account: Account,
	settings: AccountSettings
): MailsEditor => {
	const signatures = getSignatures(account);

	const signatureNewMessageValue =
		find(
			signatures,
			(signature: any) => signature.value.id === settings.prefs.zimbraPrefDefaultSignatureId
		)?.value.description ?? '';

	const textWithSignatureNewMessage = [
		`<br>${signatureNewMessageValue}`,
		`<br>${signatureNewMessageValue}`
	];

	return {
		richText: true,
		text: textWithSignatureNewMessage,
		to: [],
		cc: [],
		bcc: [],
		from: {
			type: ParticipantRole.FROM,
			address: account.name,
			name: account.name,
			fullName: account.displayName
		},
		sender: {},
		editorId,
		subject: '',
		attach: { mp: [] },
		urgent: false,
		requestReadReceipt: false,
		id: undefined,
		attachmentFiles: []
	};
};

export const retrieveFROM = (original: MailMessage): Array<Participant> =>
	filter(original.participants, (c: Participant): boolean => c.type === ParticipantRole.FROM);

export const changeParticipantRole = (
	original: MailMessage,
	previousRole: ParticipantRole,
	newRole: ParticipantRole
): Array<Participant> =>
	map(
		filter(original.participants, (c) => c.type === previousRole),
		(c) => ({ ...c, type: newRole })
	);

export const changeTypeOfParticipants = (
	participants: Array<Participant>,
	newRole: ParticipantRole
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

export function retrieveALL(original: MailMessage, accounts: Array<Account>): Array<Participant> {
	const toEmails = filter(
		original.participants,
		(c: Participant): boolean => c.type === ParticipantRole.TO
	);
	const fromEmails = filter(
		original.participants,
		(c: Participant): boolean => c.type === ParticipantRole.FROM && c.address !== accounts[0].name
	);
	const replyToParticipants = filter(
		original.participants,
		(c: Participant): boolean => c.type === ParticipantRole.REPLY_TO
	);

	const isSentByMe = some(
		filter(original.participants, (c: Participant): boolean => c.type === ParticipantRole.FROM),
		{ address: accounts[0].name }
	);
	if (replyToParticipants.length === 0) {
		if (original.parent === FOLDERS.SENT || original.isSentByMe || isSentByMe) {
			return filter(toEmails, (c) => c.address !== accounts[0].name).length === 0
				? toEmails
				: filter(toEmails, (c) => c.address !== accounts[0].name);
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
	accounts: Array<Account> = []
): Array<Participant> {
	const toEmails = filter(
		original.participants,
		(c: Participant): boolean => c.type === ParticipantRole.TO && c.address !== accounts[0]?.name
	);
	const ccEmails = filter(
		original.participants,
		(c: Participant): boolean =>
			c.type === ParticipantRole.CARBON_COPY && c.address !== accounts[0]?.name
	);
	const finalTo = retrieveALL(original, accounts);

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
		const uniqueParticipants = reduce(
			concat(toEmails, reducedCcEmails),
			(acc: Participant[], v: Participant) => {
				if (!(finalTo.filter((x) => x.address === v.address).length > 0))
					acc.push({ ...v, type: ParticipantRole.CARBON_COPY });
				return acc;
			},
			[]
		);
		return uniqueParticipants;
	}

	return changeTypeOfParticipants(reducedCcEmails, ParticipantRole.CARBON_COPY);
}

export const retrieveBCC = (original: MailMessage): Array<Participant> =>
	filter(
		original.participants,
		(c: Participant): boolean => c.type === ParticipantRole.BLIND_CARBON_COPY
	);

export function findAttachments(
	parts: Array<MailMessagePart>,
	acc: Array<EditorAttachmentFiles>
): Array<EditorAttachmentFiles> {
	return reduce(
		parts,
		(found, part) => {
			if (part && part.disposition === 'attachment' && !part.ci) {
				found.push(part);
			}
			if (part.parts) return findAttachments(part.parts, found);
			return acc;
		},
		acc as Array<EditorAttachmentFiles>
	);
}

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
	const html = htmlArr.length ? htmlArr[0] : undefined;
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
		`\n\n---------------------------\n${labels.from} ${headingFrom}\n${labels.to} ${headingTo}\n`,
		`<br /><br /><hr id="zwchr" ><b>${labels.from}</b> ${headingFrom} <br /> <b>${labels.to}</b> ${headingTo} <br />`
	];

	if (headingCc.length > 0) {
		textToRetArray[1] += `<b>${labels.cc}</b> ${headingCc}<br />`;
		textToRetArray[0] += `${labels.cc} ${headingCc}\n`;
	}

	textToRetArray[1] += `<b>${labels.sent}</b> ${date} <br /> <b>${labels.subject}</b> ${
		mail.subject
	} <br /><br />${extractBody(mail)[1]}`;

	textToRetArray[0] += `${labels.sent} ${date}\n${labels.subject} ${mail.subject}\n\n${
		extractBody(mail)[0]
	}`;
	return textToRetArray;
}
export const generateMailRequest = (msg: MailMessage): SoapDraftMessageObj => {
	const richText = extractBody(msg);
	const body = isHtml(msg.parts);
	return {
		id: msg.id === 'new' ? undefined : msg.id,
		did: msg.isDraft ? msg.did ?? msg.id : undefined,
		attach: { mp: retrieveAttachmentsType(msg, 'attachment') },
		su: { _content: msg.subject ?? '' },
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

export const generateRequest = (data: MailsEditor): SoapDraftMessageObj => {
	const participants = map(
		// eslint-disable-next-line no-nested-ternary
		data.participants
			? data.participants
			: isEmpty(data.sender)
			? [data.from, ...data.to, ...data.cc, ...data.bcc]
			: [data.from, data.sender, ...data.to, ...data.cc, ...data.bcc],
		(c) => ({
			t: c.type,
			a: (c as unknown as SharedParticipant).email ?? (c as unknown as Participant).address,
			d:
				(c as unknown as Participant).fullName ??
				(c as unknown as SharedParticipant).firstName ??
				undefined
		})
	);
	if (data.requestReadReceipt) {
		participants.push({
			a:
				(data?.from as unknown as SharedParticipant)?.email ??
				(data?.from as unknown as Participant)?.address,
			t: ParticipantRole.READ_RECEIPT_NOTIFICATION,
			d:
				(data?.from as unknown as Participant).fullName ??
				(data?.from as unknown as SharedParticipant).firstName ??
				undefined
		});
	}

	return {
		autoSendTime: data.autoSendTime,
		did: data.did ?? undefined,
		id: data.id ?? undefined,
		attach: data.attach,
		su: { _content: data.subject ?? '' },
		rt: data?.rt ?? undefined,
		origid: data?.origid ?? undefined,
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		e: participants,
		mp: [
			data.richText
				? {
						ct: 'multipart/alternative',
						mp: [
							{
								ct: 'text/html',
								body: true,
								content: { _content: data?.text[1] ?? '' }
							},
							{
								ct: 'text/plain',
								content: { _content: data?.text[0] ?? '' }
							}
						]
				  }
				: {
						ct: 'text/plain',
						body: true,
						content: { _content: data?.text[0] ?? '' }
				  }
		]
	};
};
