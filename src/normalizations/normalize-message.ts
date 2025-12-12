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
import { find, isNil, map, omitBy, orderBy, reduce } from 'lodash';

import {
	getCreationDateFromMailHeadersFromAPI,
	getMessageIdFromMailHeadersFromAPI,
	getMessageIsFromDistributionListFromAPI,
	getMessageIsFromExternalDomainFromAPI,
	getSensitivityHeaderFromAPI
} from 'normalizations/mail-header-utils';
import { getTagIds } from 'normalizations/utils';
import {
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
const getFlags = (m: SoapPartialIncompleteMessage | undefined): Flags | NonNullable<unknown> => {
	if (isNil(m?.f)) {
		return {};
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
			attachments: m.mp ? m.mp : undefined,
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
			attachments: m.mp ? m.mp : undefined,
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
