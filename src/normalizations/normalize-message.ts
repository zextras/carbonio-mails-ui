/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { getTags } from '@zextras/carbonio-shell-ui';
import { filter, find, forEach, isNil, map, omitBy, reduce } from 'lodash';
import { ParticipantRole } from '../commons/utils';
import {
	AttachmentPart,
	IncompleteMessage,
	MailMessagePart,
	Participant,
	SoapEmailParticipantRole,
	SoapIncompleteMessage,
	SoapMailMessagePart,
	SoapMailParticipant
} from '../types';

// finds if in the content there is a "cid:"" string
const findCidInHTMLBody = (
	multipart: Array<SoapMailMessagePart> | undefined | AttachmentPart | Array<AttachmentPart>
): boolean => {
	let hasCidInBody = false;

	const extractCid = (
		mp: Array<SoapMailMessagePart> | undefined | AttachmentPart | Array<AttachmentPart>
	): void => {
		forEach(mp, (item: SoapMailMessagePart) => {
			if (item.mp) {
				extractCid(item.mp);
			}
			if (item.content) {
				hasCidInBody = item.content.includes('cid:');
			}
		});
	};

	extractCid(multipart);
	return hasCidInBody;
};

const getAttachmentsFromParts = (
	mp: Array<SoapMailMessagePart> | undefined | AttachmentPart | Array<AttachmentPart>
): Array<AttachmentPart> => {
	const attachments: Array<AttachmentPart> = [];
	forEach(mp, (item: SoapMailMessagePart) => {
		if (item.mp) {
			attachments.push(...getAttachmentsFromParts(item.mp));
		}
		// exclude attachments that are not real attachments
		if (
			(item.ct && item.ct.startsWith('multipart/')) ||
			item.ct === 'message/rfc822' ||
			item.ct === 'text/html' ||
			item.ct === 'text/plain' ||
			item.ct === 'application/applefile' ||
			item.ct === 'multipart/appledouble' ||
			(item.ct === 'text/calendar' && !item.filename)
		) {
			return;
		}
		// if the attachment has cd = inline but has no "cid:" in the body, it is treated as a normal attachment
		if (item.part && item.part) {
			attachments.push({
				...item,
				part: item.part,
				size: item.s,
				ci: item.ci,
				name: item.part,
				cd: item.cd === 'inline' && findCidInHTMLBody(mp) ? item.cd : 'attachment'
			});
		}
	});
	return attachments;
};

const normalizeMailPartMapFn = (v: SoapMailMessagePart): MailMessagePart => {
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
};

const findBodyPart = (
	mp: Array<SoapMailMessagePart>,
	acc: { contentType: string; content: string },
	id: string
): { contentType: string; content: string } => {
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
};

const generateBody = (
	mp: Array<SoapMailMessagePart>,
	id: string
): {
	contentType: string;
	content: string;
} => findBodyPart(mp, { contentType: '', content: '' }, id);

const participantTypeFromSoap = (t: SoapEmailParticipantRole): ParticipantRole => {
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
};

export const normalizeParticipantsFromSoap = (e: SoapMailParticipant): Participant => ({
	type: participantTypeFromSoap(e.t),
	address: e.a,
	name: e.d || e.a,
	fullName: e.p
});

const getTagIdsFromName = (names: string | undefined): Array<string | undefined> => {
	const tags = getTags();
	return map(names?.split(','), (name) =>
		find(tags, { name }) ? find(tags, { name })?.id : `nil:${name}`
	);
};

const getTagIds = (t: string | undefined, tn: string | undefined): Array<string | undefined> => {
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
