/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { getTags } from '@zextras/carbonio-shell-ui';
import { filter, find, forEach, isArray, isNil, map, omitBy, reduce } from 'lodash';

import {
	ParticipantRole,
	ParticipantRoleType
} from '../carbonio-ui-commons/constants/participants';
import { getFolder } from '../carbonio-ui-commons/store/zustand/folder/hooks';
import { useFolderStore } from '../carbonio-ui-commons/store/zustand/folder/store';
import {
	AttachmentPart,
	BodyPart,
	IncompleteMessage,
	MailMessage,
	MailMessagePart,
	Participant,
	SoapEmailParticipantRole,
	SoapIncompleteMessage,
	SoapMailMessage,
	SoapMailMessagePart,
	SoapMailParticipant
} from '../types';

type Flags = {
	read: boolean;
	hasAttachment?: boolean;
	flagged?: boolean;
	urgent?: boolean;
	isDeleted?: boolean;
	isDraft?: boolean;
	isForwarded?: boolean;
	isSentByMe?: boolean;
	isInvite?: boolean;
	isReplied?: boolean;
};

// extract ids of attachments from html content. the ids are preceded by "cid: and end with " or with &
export const extractAttachmentIdsFromHtmlContent = (content: string): Array<string> => {
	const matches = content.match(/cid:(.*?)(?="|&)/g);
	return matches ? map(matches, (match) => match.replace('cid:', '')) : [];
};

// examine the multipart and return an array of ids referenced in the body of the html
const getAttachmentsAnchoredOnHtmlBody = (
	multipart: Array<SoapMailMessagePart> | undefined | AttachmentPart | Array<AttachmentPart>
): Array<string> => {
	const result: Array<string> = [];

	const extractCid = (
		mp: Array<SoapMailMessagePart> | undefined | AttachmentPart | Array<AttachmentPart>
	): void => {
		forEach(mp, (item: SoapMailMessagePart) => {
			if (item.mp) {
				extractCid(item.mp);
			}
			if (item.content) {
				result.push(...extractAttachmentIdsFromHtmlContent(item.content));
			}
		});
	};

	extractCid(multipart);
	return result;
};

// removes all charachters after "@" and the leading "<" character of a ci
const cleanUpCi = (id: string): string => id.slice(1, id.indexOf('@'));

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
	mailParts: Array<AttachmentPart> | AttachmentPart
): Array<AttachmentPart> => {
	const anchoredAttachmentsList = getAttachmentsAnchoredOnHtmlBody(mailParts);
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
							if (
								item.cd &&
								item.cd === 'inline' &&
								item.ci &&
								anchoredAttachmentsList.includes(cleanUpCi(item.ci))
							) {
								item.cd = 'inline';
							} else if (
								part.ct === 'multipart/related' &&
								item.ci &&
								item.cd &&
								item.cd === 'attachment' &&
								anchoredAttachmentsList.includes(cleanUpCi(item.ci))
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
				extractAttachmentIdsFromHtmlContent(updatedMailPart.content || '');
				if (
					updatedMailPart.cd &&
					updatedMailPart.cd === 'inline' &&
					updatedMailPart.ci &&
					anchoredAttachmentsList.includes(cleanUpCi(updatedMailPart.ci))
				) {
					updatedMailPart.cd = 'inline';
				} else if (
					updatedMailPart.ct === 'multipart/related' &&
					updatedMailPart.ci &&
					updatedMailPart.cd &&
					updatedMailPart.cd === 'attachment' &&
					anchoredAttachmentsList.includes(cleanUpCi(updatedMailPart.ci))
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

const normalizeMailPartMapFn = (soapMailMessagePart: SoapMailMessagePart): MailMessagePart => {
	const mailMessagePart: MailMessagePart = {
		contentType: soapMailMessagePart.ct,
		size: soapMailMessagePart.s || 0,
		name: soapMailMessagePart.part,
		disposition: soapMailMessagePart.cd,
		requiresSmartLinkConversion: soapMailMessagePart?.requiresSmartLinkConversion ?? false,
		truncated: soapMailMessagePart.truncated ?? false
	};
	if (soapMailMessagePart.mp) {
		mailMessagePart.parts = map(soapMailMessagePart.mp || [], normalizeMailPartMapFn);
	}
	if (soapMailMessagePart.filename) mailMessagePart.filename = soapMailMessagePart.filename;
	if (soapMailMessagePart.content) mailMessagePart.content = soapMailMessagePart.content;
	if (soapMailMessagePart.ci) mailMessagePart.ci = soapMailMessagePart.ci;
	if (soapMailMessagePart.cd) mailMessagePart.disposition = soapMailMessagePart.cd;
	return mailMessagePart;
};

const findBodyPart = (mp: Array<SoapMailMessagePart>, acc: BodyPart, id: string): BodyPart =>
	reduce(
		mp,
		(found, part) => {
			if (part.mp) return findBodyPart(part.mp, found, id);
			if (part && part.body) {
				if (!found.contentType.length) {
					return { contentType: part.ct, content: part.content ?? '', truncated: !!part.truncated };
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
				return {
					...found,
					content: found.content.concat(part.content ?? ''),
					truncated: !!part.truncated
				};
			}
			return found;
		},
		acc
	);

const generateBody = (
	mp: Array<SoapMailMessagePart>,
	id: string
): {
	contentType: string;
	content: string;
} => findBodyPart(mp, { contentType: '', content: '', truncated: false }, id);

const participantTypeFromSoap = (t: SoapEmailParticipantRole): ParticipantRoleType => {
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
	fullName: e.p,
	email: e.a,
	exp: e.exp,
	isGroup: e.isGroup
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

export const haveReadReceipt = (
	participants: Array<SoapMailParticipant> | undefined,
	flags: string | undefined,
	folderId: string
): boolean => {
	const folder = getFolder(folderId);
	if (isNil(participants)) return false;
	if (isNil(folder)) {
		const state = useFolderStore.getState();
		const linkFolder = state.linksIdMap[folderId] ?? null;
		if (!isNil(linkFolder)) {
			const sharedFolder = getFolder(linkFolder);
			if (!isNil(sharedFolder) && sharedFolder.perm === 'r') {
				return false;
			}
		}
	} else {
		const folderPerm = folder.perm;
		if (!isNil(folderPerm) && folderPerm === 'r') {
			return false;
		}
	}
	return participants.some(
		(participant) => !!(participant.t === 'n' && (isNil(flags) || !/n/.test(flags)))
	);
};

const getFlags = (flags: string | undefined): Flags => ({
	read: !isNil(flags) ? !/u/.test(flags) : true,
	hasAttachment: !isNil(flags) ? /a/.test(flags) : undefined,
	flagged: !isNil(flags) ? /f/.test(flags) : undefined,
	urgent: !isNil(flags) ? /!/.test(flags) : undefined,
	isDeleted: !isNil(flags) ? /x/.test(flags) : undefined,
	isDraft: !isNil(flags) ? /d/.test(flags) : undefined,
	isForwarded: !isNil(flags) ? /w/.test(flags) : undefined,
	isSentByMe: !isNil(flags) ? /s/.test(flags) : undefined,
	isInvite: !isNil(flags) ? /v/.test(flags) : undefined,
	isReplied: !isNil(flags) ? /r/.test(flags) : undefined
});

export const normalizeMailMessageFromSoap = (
	m: SoapIncompleteMessage,
	isComplete?: boolean
): IncompleteMessage => {
	const flags = getFlags(m.f);

	return <IncompleteMessage>omitBy(
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
			...flags,
			isReadReceiptRequested: haveReadReceipt(m.e, m.f, m.l) && !isNil(isComplete) && isComplete
		},
		isNil
	);
};

export const normalizeCompleteMailMessageFromSoap = (m: SoapMailMessage): MailMessage =>
	normalizeMailMessageFromSoap(m, true);
