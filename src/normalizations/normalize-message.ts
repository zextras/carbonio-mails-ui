/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import {
	getFolder,
	getIdentitiesDescriptors,
	ParticipantRole,
	ParticipantRoleType,
	useFolderStore
} from '@zextras/carbonio-ui-commons';
import { find, forEach, isArray, isNil, map, omitBy, orderBy, reduce } from 'lodash';

import { extractContentIdsFromHtml, removeAngleBrackets } from 'commons/content-id-utils';
import {
	getCreationDateFromMailHeadersFromAPI,
	getMessageIdFromMailHeadersFromAPI,
	getMessageIsFromDistributionListFromAPI,
	getMessageIsFromExternalDomainFromAPI,
	getSensitivityHeaderFromAPI
} from 'normalizations/mail-header-utils';
import { getTagIds } from 'normalizations/utils';
import {
	AttachmentPart,
	BodyPart,
	IncompleteMessage,
	MailHeaders,
	MailMessage,
	MailMessagePart,
	Participant,
	SoapEmailParticipantRole,
	SoapIncompleteMessage,
	SoapMailMessage,
	SoapMailMessagePart,
	SoapMailParticipant
} from 'types/index.d';
import {
	PartialIncompleteMessage,
	SoapPartialIncompleteMessage
} from 'views/sidebar/commons/types';

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

/**
 * Recursively examines multipart structure and extracts all Content-IDs
 * referenced in HTML body parts.
 *
 * @param multipart - The multipart structure to examine
 * @returns Array of Content-IDs found in HTML content
 */
const getAttachmentsAnchoredOnHtmlBody = (
	multipart: Array<SoapMailMessagePart> | undefined | AttachmentPart | Array<AttachmentPart>
): Array<string> => {
	const result: Array<string> = [];

	const extractFromParts = (
		parts: Array<SoapMailMessagePart> | undefined | AttachmentPart | Array<AttachmentPart>
	): void => {
		forEach(parts, (part: SoapMailMessagePart) => {
			if (part.mp) {
				extractFromParts(part.mp);
			}
			if (part.content) {
				result.push(...extractContentIdsFromHtml(part.content));
			}
		});
	};

	extractFromParts(multipart);
	return result;
};

/**
 * Determines if an attachment part should be ignored and not included in the attachments list.
 * Ignores Apple-specific formats, body parts, and calendar invites without filenames.
 *
 * @param item - The attachment part to check
 * @returns True if the attachment should be ignored
 */
const isIgnoredAttachment = (item: AttachmentPart): boolean => {
	// Ignore Apple-specific attachment formats
	if (item.ct === 'multipart/appledouble' || item.ct === 'application/applefile') {
		return true;
	}
	// Ignore HTML/plain text body parts
	if (item.body && (item.ct === 'text/html' || item.ct === 'text/plain')) {
		return true;
	}
	// Ignore multipart/digest containers
	if (item.ct === 'multipart/digest') {
		return true;
	}
	// Ignore text-body markers
	if (item.ci === 'text-body') {
		return true;
	}
	// Ignore calendar invites without filenames (they're typically embedded)
	return item.ct === 'text/calendar' && !item.filename;
};

/**
 * Recursively checks if a multipart structure contains any HTML content.
 * Used to determine if CID lookup is reliable for distinguishing inline vs attachment disposition.
 *
 * @param parts - Multipart structure to check
 * @returns True if HTML content is found anywhere in the structure
 */
const hasHtmlContent = (parts: Array<AttachmentPart> | AttachmentPart): boolean => {
	if (isArray(parts)) {
		return parts.some((part) => hasHtmlContent(part));
	}
	if (parts.ct === 'text/html' && parts.body) {
		return true;
	}
	if (parts.mp) {
		return hasHtmlContent(parts.mp);
	}
	return false;
};

/**
 * Extracts and normalizes attachments from SOAP message parts.
 * Handles proper classification of inline vs regular attachments based on Content-ID references in HTML.
 *
 * Key behaviors:
 * - Items with Content-IDs referenced in HTML body are marked as 'inline'
 * - Items with Content-IDs NOT referenced (but marked inline) are changed to 'attachment'
 * - Filters out body parts, Apple formats, and PKCS7 signatures
 * - Adds normalized properties (contentType, name, size)
 *
 * @param mailParts - SOAP mail parts structure (can be array or single part)
 * @returns Array of normalized attachment parts
 */
export const getAttachmentsFromParts = (
	mailParts: Array<AttachmentPart> | AttachmentPart
): Array<AttachmentPart> => {
	const anchoredAttachmentsList = getAttachmentsAnchoredOnHtmlBody(mailParts);
	const hasHtml = hasHtmlContent(mailParts);
	let results: Array<AttachmentPart> = [];

	if (!mailParts) {
		return results;
	}

	if (isArray(mailParts)) {
		forEach(mailParts, (part) => {
			const attachmentParts = getAttachmentsFromParts(part);
			forEach(attachmentParts, (attachmentPart: AttachmentPart) => {
				if (!isIgnoredAttachment(attachmentPart)) {
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
						// Determine content disposition based on whether it's referenced in HTML body
						if (item.ci && anchoredAttachmentsList.includes(removeAngleBrackets(item.ci))) {
							item.cd = 'inline';
						} else if (item.ci && item.cd === 'inline' && hasHtml) {
							// Not referenced in HTML but marked inline -> change to attachment
							item.cd = 'attachment';
						} else {
							item.cd ??= 'attachment';
						}

						// Add default filenames for known types
						if (item.ct === 'message/rfc822' && !item.filename) {
							item.filename = 'Unknown <message/rfc822>';
						}
						if (item.ct === 'text/html' && !item.filename) {
							item.filename = 'Unknown <text/html>';
						}

						// Exclude PKCS7 signatures
						if (item.ct && item.ct !== 'application/pkcs7-signature') {
							results.push(item);
						}
					}
				}
			});
		});
	} else if (
		(mailParts.cd && mailParts.cd === 'attachment') ||
		(mailParts.ct && (mailParts.ct === 'message/rfc822' || mailParts.ct === 'text/calendar')) ||
		mailParts.filename ||
		mailParts.ci
	) {
		if (!isIgnoredAttachment(mailParts)) {
			const updatedMailPart: AttachmentPart = {
				...mailParts,
				contentType: mailParts.ct,
				name: mailParts?.part,
				size: mailParts?.s
			};

			// Determine content disposition based on whether it's referenced in HTML body
			if (
				updatedMailPart.ci &&
				anchoredAttachmentsList.includes(removeAngleBrackets(updatedMailPart.ci))
			) {
				updatedMailPart.cd = 'inline';
			} else if (updatedMailPart.ci && updatedMailPart.cd === 'inline' && hasHtml) {
				// Not referenced in HTML but marked inline -> change to attachment
				updatedMailPart.cd = 'attachment';
			} else {
				updatedMailPart.cd ??= 'attachment';
			}

			// Add default filenames for known types
			if (updatedMailPart.ct === 'message/rfc822' && !updatedMailPart.filename) {
				updatedMailPart.filename = 'Unknown <message/rfc822>';
			}
			if (updatedMailPart.ct === 'text/html' && !updatedMailPart.filename) {
				updatedMailPart.filename = 'Unknown <text/html>';
			}

			// Exclude PKCS7 signatures
			if (updatedMailPart.ct && updatedMailPart.ct !== 'application/pkcs7-signature') {
				results.push(updatedMailPart);
			}
		}
	} else if (mailParts.mp) {
		results = results.concat(getAttachmentsFromParts(mailParts.mp));
	}

	return results;
};

const normalizeMailPartMapFn = (v: SoapMailMessagePart): MailMessagePart => {
	const ret: MailMessagePart = {
		contentType: v.ct,
		size: v.s || 0,
		name: v.part,
		disposition: v.cd,
		body: Boolean(v.body)
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

const findBodyPart = (mp: Array<SoapMailMessagePart>, acc: BodyPart, id: string): BodyPart =>
	reduce(
		mp,
		(found, part) => {
			if (part.mp) return findBodyPart(part.mp, found, id);
			if (part?.body) {
				if (!found.contentType.length) {
					return { contentType: part.ct, content: part.content ?? '', truncated: !!part.truncated };
				}
				if (
					part.part &&
					!part.part.includes('.') &&
					part.cd &&
					part.cd === 'inline' &&
					!part.ci &&
					!(part.ct && part.ct === 'text/plain')
				) {
					return {
						...found,
						content: found.content.concat(
							`<img src='/service/home/~/?auth=co&loc=en&id=${id}&part=${part?.part}'>`
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

export const haveReadReceipt = (
	participants: Array<SoapMailParticipant>,
	flags: string | undefined,
	folderId: string
): boolean => {
	const folder = getFolder(folderId);
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
		(participant) => participant.t === 'n' && (isNil(flags) || !/n/.test(flags))
	);
};

/**
 * Extracts and maps flags from a SOAP message to a Flags object.
 * */
const getFlags = (m: SoapPartialIncompleteMessage | undefined): Flags => {
	const defaultFlag = { read: true };

	if (isNil(m?.f) || m.f === '') {
		return defaultFlag;
	}
	const flags = m.f;
	return {
		read: !/u/.test(flags),
		hasAttachment: /a/.test(flags),
		flagged: /f/.test(flags),
		urgent: /!/.test(flags),
		isDeleted: /x/.test(flags),
		isDraft: /d/.test(flags),
		isForwarded: /w/.test(flags),
		isSentByMe: /s/.test(flags),
		isInvite: /v/.test(flags),
		isReplied: /r/.test(flags)
	};
};

export const normalizeMailMessageFromSoap = (
	m: SoapIncompleteMessage,
	isComplete?: boolean
): IncompleteMessage => {
	const { ownerAccount } = getIdentitiesDescriptors().filter(
		(identity) => identity.type === 'primary'
	)[0];

	const normalizedMailHeaders: MailHeaders = {
		signature: m?.signature,
		messageIsFromExternalDomain: getMessageIsFromExternalDomainFromAPI(m._attrs, ownerAccount),
		// authenticationHeaders: getAuthenticationHeadersFromAPI(m._attrs),
		sensitivity: getSensitivityHeaderFromAPI(m._attrs),
		messageIdFromMailHeaders: getMessageIdFromMailHeadersFromAPI(m._attrs),
		creationDateFromMailHeaders: getCreationDateFromMailHeadersFromAPI(m._attrs),
		messageIsFromDistributionList: getMessageIsFromDistributionListFromAPI(m._attrs)
	};
	// FIXME: omitBy breaks typing, consider not using it. many types are actually required but are omitted at runtime
	return <IncompleteMessage>omitBy(
		{
			conversation: m.cid,
			id: m.id,
			date: m.d,
			size: m.s,
			parent: m.l,
			replyType: m.rt,
			originalId: m.origid,
			fragment: m.fr,
			subject: m.su,
			participants: m.e
				? orderBy(map(m.e || [], normalizeParticipantsFromSoap), ['type'], 'asc')
				: undefined,
			tags: getTagIds(m.t, m.tn),
			parts: m.mp ? map(m.mp || [], normalizeMailPartMapFn) : undefined,
			attachments: m.mp ? getAttachmentsFromParts(m.mp) : undefined,
			invite: m.inv,
			shr: m.shr,
			body: m.mp ? generateBody(m.mp || [], m.id) : undefined,
			isComplete,
			isScheduled: !!m.autoSendTime,
			autoSendTime: m.autoSendTime,
			...getFlags(m),
			isReadReceiptRequested: m.e
				? haveReadReceipt(m.e, m.f, m.l) && !isNil(isComplete) && isComplete
				: undefined,
			isEncrypted: !!find(m.mp, (part) => part.ct === 'application/pkcs7-mime'),
			...normalizedMailHeaders
		},
		isNil
	);
};

export const normalizeCompleteMailMessageFromSoap = (m: SoapMailMessage): MailMessage =>
	normalizeMailMessageFromSoap(m, true);

export const normalizePartialIncompleteMessageFromSoap = (
	m: SoapPartialIncompleteMessage
): PartialIncompleteMessage => {
	const { ownerAccount } = getIdentitiesDescriptors().filter(
		(identity) => identity.type === 'primary'
	)[0];

	const normalizedMailHeaders: MailHeaders = {
		signature: m?.signature,
		messageIsFromExternalDomain: m._attrs
			? getMessageIsFromExternalDomainFromAPI(m._attrs, ownerAccount)
			: undefined,
		// authenticationHeaders: getAuthenticationHeadersFromAPI(m._attrs),
		sensitivity: getSensitivityHeaderFromAPI(m._attrs),
		messageIdFromMailHeaders: getMessageIdFromMailHeadersFromAPI(m._attrs),
		creationDateFromMailHeaders: getCreationDateFromMailHeadersFromAPI(m._attrs),
		messageIsFromDistributionList: m._attrs
			? getMessageIsFromDistributionListFromAPI(m._attrs)
			: undefined
	};
	// FIXME: omitBy breaks typing, consider not using it. many types are actually required but are omitted at runtime
	const partialData = <IncompleteMessage>omitBy(
		{
			conversation: m.cid,
			date: m.d,
			size: m.s,
			parent: m.l,
			replyType: m.rt,
			originalId: m.origid,
			fragment: m.fr,
			subject: m.su,
			participants: m.e
				? orderBy(map(m.e || [], normalizeParticipantsFromSoap), ['type'], 'asc')
				: undefined,
			tags: getTagIds(m.t, m.tn),
			parts: m.mp ? map(m.mp || [], normalizeMailPartMapFn) : undefined,
			attachments: m.mp ? getAttachmentsFromParts(m.mp) : undefined,
			invite: m.inv,
			shr: m.shr,
			body: m.mp ? generateBody(m.mp || [], m.id) : undefined,
			isScheduled: m.autoSendTime ? m.autoSendTime : undefined,
			autoSendTime: m.autoSendTime,
			...getFlags(m),
			// TODO: this function is accepting undefined values and assuming defaults
			isReadReceiptRequested: m.e ? haveReadReceipt(m.e, m.f, m.l ?? '') : undefined,
			isEncrypted: m.mp ? !!find(m.mp, (part) => part.ct === 'application/pkcs7-mime') : undefined,
			...normalizedMailHeaders
		},
		isNil
	);
	return { ...partialData, id: m.id };
};
