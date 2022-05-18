/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import moment from 'moment';
import { find, isArray } from 'lodash';

export function getTimeLabel(date) {
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
}

export function participantToString(participant, t, accounts) {
	const me = find(accounts, ['name', participant?.address]);
	if (me) {
		return t('label.me', 'Me');
	}
	return participant?.fullName || participant?.name || participant?.address || '';
}

export function isAvaiableInTrusteeList(trusteeList, address) {
	let trusteeAddress = [];
	let avaiableInTrusteeList = false;
	if (trusteeList) {
		trusteeAddress = isArray(trusteeList) ? trusteeList : trusteeList.split(',');
	}
	if (trusteeAddress.length > 0) {
		const domain = address.split('@')[1];
		trusteeAddress.forEach((ta) => {
			if (ta === domain || ta === address) {
				avaiableInTrusteeList = true;
			}
		});
	}
	return avaiableInTrusteeList;
}
