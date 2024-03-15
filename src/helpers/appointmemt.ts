/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import {
	getAddressOwnerAccount,
	getIdentitiesDescriptors,
	getRecipientReplyIdentity
} from './identities';
import { getRootsMap } from '../carbonio-ui-commons/store/zustand/folder/hooks';
import { NO_ACCOUNT_NAME } from '../constants';
import { retrieveALL, retrieveCC } from '../store/editor-slice-utils';
import type { MailMessage } from '../types';
import { Attendee, MatchingReplyIdentity, SenderType } from '../types/calendar';

/**
 * Analyze the message and return the identity that should be used as organizer.
 * @param message
 */
const getOrganizer = (message: MailMessage): MatchingReplyIdentity => {
	const folderRoots = getRootsMap();
	const from: MatchingReplyIdentity = getRecipientReplyIdentity(folderRoots, message);
	return from;
};

/**
 * Analyze the message and return the attendees for appointment.
 * @param message
 */
const getAttendees = (message: MailMessage): Array<Attendee> => {
	const matchIdentity = getOrganizer(message);
	const accountName = getAddressOwnerAccount(matchIdentity.address) ?? NO_ACCOUNT_NAME;
	const toParticipants = retrieveALL(message, accountName);
	const calAttendees: Array<Attendee> = toParticipants.map(({ address }) => ({ email: address }));
	return calAttendees;
};

/**
 * Analyze the message and return the optionals attendees for appointment.
 * @param message
 */
const getOptionalsAttendees = (message: MailMessage): Array<Attendee> => {
	const matchIdentity = getOrganizer(message);
	const accountName = getAddressOwnerAccount(matchIdentity.address) ?? NO_ACCOUNT_NAME;
	const ccParticipants = retrieveCC(message, accountName);
	const calOptionals: Array<Attendee> = ccParticipants.map(({ address }) => ({ email: address }));
	return calOptionals;
};

/**
 *
 * @param address
 */
const getSenderByOwner = (address?: string): SenderType | null => {
	if (!address) {
		return null;
	}
	const identitiesList = getIdentitiesDescriptors();
	const matchIdentity = identitiesList.find(
		(identityDescriptor) => identityDescriptor.ownerAccount === address
	);
	return matchIdentity
		? {
				address: matchIdentity.ownerAccount,
				fullName: matchIdentity.fromDisplay ?? matchIdentity.identityName,
				identityName: matchIdentity.identityName,
				label: matchIdentity.identityName
		  }
		: null;
};

export { getOrganizer, getAttendees, getOptionalsAttendees, getSenderByOwner };
