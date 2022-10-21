/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { getTags } from '@zextras/carbonio-shell-ui';
import { filter, find, isNil, map, reduce, omitBy, isArray, forEach } from 'lodash';
import { ParticipantRole } from '../commons/utils';
import {
	IncompleteMessage,
	MailMessagePart,
	SoapEmailParticipantRole,
	SoapMailParticipant,
	Participant,
	SoapIncompleteMessage,
	SoapMailMessagePart,
	AttachmentPart
} from '../types';

const isIgnoreAttachment = (item: AttachmentPart): boolean => {
	if ((item && item.ct === 'multipart/appledouble') || item.ct === 'application/applefile') {
		return true;
	}
	if (item.body && (item.ct === 'text/html' || item.ct === 'text/plain')) {
		return true;
	}
	if (item.ct === 'multipart/digest') {
		return true;
	}
	if (item.ci && item.ci === 'text-body') {
		return true;
	}
	if (item.ct === 'text/calendar' && !item.filename) {
		return true;
	}
	return false;
};

export const getAttachmentsFromParts = (
	mailParts: Array<AttachmentPart> | AttachmentPart | any
): Array<AttachmentPart> => {
	let results: Array<AttachmentPart> = [];
	if (mailParts) {
		if (isArray(mailParts)) {
			forEach(mailParts, (part) => {
				const attachmentParts = getAttachmentsFromParts(part);
				forEach(attachmentParts, (attachmentPart: AttachmentPart) => {
					if (!isIgnoreAttachment(attachmentPart)) {
						const item = {
							...attachmentPart,
							contentType: attachmentPart.ct,
							name: attachmentPart?.part,
							size: attachmentPart?.s
						};
						if (
							(item.cd && item.cd === 'attachment') ||
							(item.ct && (item.ct === 'message/rfc822' || item.ct === 'text/calendar')) ||
							item.filename ||
							item.ci
						) {
							if (item.cd && item.cd === 'inline' && item.ci) {
								item.cd = 'inline';
							} else if (
								part.ct === 'multipart/related' &&
								item.ci &&
								item.cd &&
								item.cd === 'attachment'
							) {
								item.cd = 'inline';
							} else {
								item.cd = 'attachment';
							}
							if (item.ct === 'message/rfc822' && !item.filename) {
								item.filename = 'Unknown <message/rfc822>';
							}
							if (item.ct === 'text/html' && !item.filename) {
								item.filename = 'Unknown <text/html>';
							}
							if (item.ct && item.ct !== 'application/pkcs7-signature') {
								// eslint-disable-next-line @typescript-eslint/ban-ts-comment
								// @ts-ignore
								results.push(item);
							}
						}
					}
				});
			});
		} else if (
			(mailParts && mailParts.cd && mailParts.cd === 'attachment') ||
			(mailParts.ct && (mailParts.ct === 'message/rfc822' || mailParts.ct === 'text/calendar')) ||
			mailParts.filename ||
			mailParts.ci
		) {
			const updatedMailPart: AttachmentPart = { ...mailParts };
			if (isIgnoreAttachment(mailParts)) {
				if (updatedMailPart.cd && updatedMailPart.cd === 'inline' && updatedMailPart.ci) {
					updatedMailPart.cd = 'inline';
				} else if (
					updatedMailPart.ct === 'multipart/related' &&
					updatedMailPart.ci &&
					updatedMailPart.cd &&
					updatedMailPart.cd === 'attachment'
				) {
					updatedMailPart.cd = 'inline';
				} else {
					updatedMailPart.cd = 'attachment';
				}
			}
			results.push(updatedMailPart);
		} else if (mailParts.mp) {
			results = results.concat(getAttachmentsFromParts(mailParts.mp));
		}
	}
	return results;
};

export function normalizeMailPartMapFn(v: SoapMailMessagePart): MailMessagePart {
	const ret: MailMessagePart = {
		contentType: v.ct,
		size: v.s || 0,
		name: v.part,
		disposition: v.cd
	};
	if (v.mp) {
		ret.parts = map(v.mp || [], normalizeMailPartMapFn);
	}
	if (v.filename) ret.filename = v.filename;
	if (v.content) ret.content = v.content;
	if (v.ci) ret.ci = v.ci;
	if (v.cd) ret.disposition = v.cd;
	return ret;
}

function findBodyPart(
	mp: Array<SoapMailMessagePart>,
	acc: { contentType: string; content: string },
	id: string
): { contentType: string; content: string } {
	const bodyPart = reduce(
		mp,
		(found, part) => {
			if (part.mp) return findBodyPart(part.mp, found, id);
			if (part && part.body) {
				if (!found.contentType.length) {
					return { contentType: part.ct, content: part.content ?? '' };
				}
				if (
					part.part &&
					part.part.indexOf('.') === -1 &&
					part.cd &&
					part.cd === 'inline' &&
					!part.ci &&
					!(part.ct && part.ct === 'text/plain')
				) {
					return {
						...found,
						content: found.content.concat(
							`<img src='/service/home/~/?auth=co&loc=en&id=${id}&part=${part?.part}'>` ?? ''
						)
					};
				}
				return { ...found, content: found.content.concat(part.content ?? '') };
			}
			return found;
		},
		acc
	);

	return bodyPart;
}

export function generateBody(
	mp: Array<SoapMailMessagePart>,
	id: string
): {
	contentType: string;
	content: string;
} {
	return findBodyPart(mp, { contentType: '', content: '' }, id);
}

function participantTypeFromSoap(t: SoapEmailParticipantRole): ParticipantRole {
	switch (t) {
		case 'f':
			return ParticipantRole.FROM;
		case 't':
			return ParticipantRole.TO;
		case 'c':
			return ParticipantRole.CARBON_COPY;
		case 'b':
			return ParticipantRole.BLIND_CARBON_COPY;
		case 'r':
			return ParticipantRole.REPLY_TO;
		case 's':
			return ParticipantRole.SENDER;
		case 'n':
			return ParticipantRole.READ_RECEIPT_NOTIFICATION;
		case 'rf':
			return ParticipantRole.RESENT_FROM;
		default:
			throw new Error(`Participant type not handled: '${t}'`);
	}
}

export function normalizeParticipantsFromSoap(e: SoapMailParticipant): Participant {
	return {
		type: participantTypeFromSoap(e.t),
		address: e.a,
		name: e.d || e.a,
		fullName: e.p
	};
}
export const getTagIdsFromName = (names: string | undefined): Array<string | undefined> => {
	const tags = getTags();
	return map(names?.split(','), (name) =>
		find(tags, { name }) ? find(tags, { name })?.id : `nil:${name}`
	);
};

export const getTagIds = (
	t: string | undefined,
	tn: string | undefined
): Array<string | undefined> => {
	if (!isNil(t)) {
		return filter(t.split(','), (tag) => tag !== '');
	}
	if (!isNil(tn)) {
		return getTagIdsFromName(tn);
	}
	return [];
};
export const normalizeMailMessageFromSoap = (
	m: SoapIncompleteMessage,
	isComplete?: boolean
): IncompleteMessage => <IncompleteMessage>omitBy(
		{
			conversation: m.cid,
			id: m.id,
			date: m.d,
			size: m.s,
			parent: m.l,
			fragment: m.fr,
			subject: m.su,
			participants: m.e ? map(m.e || [], normalizeParticipantsFromSoap) : undefined,
			tags: getTagIds(m.t, m.tn),
			parts: m.mp ? map(m.mp || [], normalizeMailPartMapFn) : undefined,
			attachments: m.mp ? getAttachmentsFromParts(m.mp) : undefined,
			invite: m.inv,
			shr: m.shr,
			body: m.mp ? generateBody(m.mp || [], m.id) : undefined,
			isComplete,
			isScheduled: !!m.autoSendTime,
			autoSendTime: m.autoSendTime,
			read: !isNil(m.f) ? !/u/.test(m.f) : true,
			hasAttachment: !isNil(m.f) ? /a/.test(m.f) : undefined,
			flagged: !isNil(m.f) ? /f/.test(m.f) : undefined,
			urgent: !isNil(m.f) ? /!/.test(m.f) : undefined,
			isDeleted: !isNil(m.f) ? /x/.test(m.f) : undefined,
			isDraft: !isNil(m.f) ? /d/.test(m.f) : undefined,
			isForwarded: !isNil(m.f) ? /w/.test(m.f) : undefined,
			isSentByMe: !isNil(m.f) ? /s/.test(m.f) : undefined,
			isInvite: !isNil(m.f) ? /v/.test(m.f) : undefined,
			isReplied: !isNil(m.f) ? /r/.test(m.f) : undefined,
			isReadReceiptRequested: !isNil(m.f) ? !/n/.test(m.f) : true
		},
		isNil
	);
