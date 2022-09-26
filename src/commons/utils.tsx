/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import moment from 'moment';
import { find, isArray } from 'lodash';
import { TFunction } from 'react-i18next';
import { Account } from '@zextras/carbonio-shell-ui';
import { Participant } from '../types/participant';

export const getTimeLabel = (date: number): string => {
	const momentDate = moment(date);
	if (momentDate.isSame(new Date(), 'day')) {
		return momentDate.format('LT');
	}
	if (momentDate.isSame(new Date(), 'week')) {
		return momentDate.format('dddd, LT');
	}
	if (momentDate.isSame(new Date(), 'month')) {
		return momentDate.format('DD MMMM');
	}
	return momentDate.format('DD/MM/YYYY');
};

export const participantToString = (
	participant: Participant | undefined,
	t: TFunction,
	accounts: Array<Account>
): string => {
	const me = find(accounts, ['name', participant?.address]);
	if (me) {
		return t('label.me', 'Me');
	}
	return participant?.fullName || participant?.name || participant?.address || '';
};

export const isAvailableInTrusteeList = (
	trusteeList: Array<string> | string,
	address: string
): boolean => {
	let trusteeAddress: Array<string> = [];
	let availableInTrusteeList = false;
	if (trusteeList) {
		trusteeAddress = isArray(trusteeList) ? trusteeList : trusteeList.split(',');
	}
	if (trusteeAddress.length > 0) {
		const domain = address.substring(address.lastIndexOf('@') + 1);
		trusteeAddress.forEach((ta) => {
			if (ta === domain || ta === address) {
				availableInTrusteeList = true;
			}
		});
	}
	return availableInTrusteeList;
};

// eslint-disable-next-line no-shadow
export enum LineType {
	ORIG_UNKNOWN = 'UNKNOWN',
	ORIG_QUOTED = 'QUOTED',
	ORIG_SEP_STRONG = 'SEP_STRONG',
	ORIG_WROTE_STRONG = 'WROTE_STRONG',
	ORIG_WROTE_WEAK = 'WROTE_WEAK',
	ORIG_HEADER = 'HEADER',
	ORIG_LINE = 'LINE',
	HTML_SEP_ID = 'zwchr',
	NOTES_SEPARATOR = '*~*~*~*~*~*~*~*~*~*'
}

// eslint-disable-next-line no-shadow
export enum FolderActionsType {
	NEW = 'new',
	MOVE = 'move',
	DELETE = 'delete',
	EDIT = 'edit',
	EMPTY = 'empty',
	REMOVE_FROM_LIST = 'removeFromList',
	SHARES_INFO = 'sharesInfo',
	SHARE = 'share',
	MARK_ALL_READ = 'share'
}

// eslint-disable-next-line no-shadow
export enum ParticipantRole {
	FROM = 'f',
	TO = 't',
	CARBON_COPY = 'c',
	BLIND_CARBON_COPY = 'b',
	REPLY_TO = 'r',
	SENDER = 's',
	READ_RECEIPT_NOTIFICATION = 'n',
	RESENT_FROM = 'rf'
}

// eslint-disable-next-line no-shadow
export enum ActionsType {
	NEW = 'new',
	EDIT_AS_DRAFT = 'editAsDraft',
	EDIT_AS_NEW = 'editAsNew',
	REPLY = 'reply',
	REPLY_ALL = 'replyAll',
	FORWARD = 'forward',
	MAIL_TO = 'mailTo',
	COMPOSE = 'compose',
	PREFILL_COMPOSE = 'prefillCompose'
}

// eslint-disable-next-line no-shadow
export enum TagsActionsType {
	NEW = 'new',
	DELETE = 'delete',
	EDIT = 'edit',
	Apply = 'apply'
}
