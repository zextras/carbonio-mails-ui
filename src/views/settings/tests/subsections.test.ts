/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import {
	allowedSendersSubSection,
	blockedSendersSubSection,
	displayingMessagesSubSection,
	filtersSubSection,
	receivingMessagesSubSection,
	recoverMessagesSubSection,
	setDefaultSignaturesSubSection,
	signaturesSubSection,
	trustedAddressesSubSection
} from '../subsections';

describe('Settings subsections', () => {
	test('displayingMessagesSubSection should return a specific result', () => {
		expect(displayingMessagesSubSection()).toEqual({
			label: 'settings.label.display_messages',
			id: 'displaying_messages'
		});
	});

	test('receivingMessagesSubSection should return a specific result', () => {
		expect(receivingMessagesSubSection()).toEqual({
			label: 'label.receive_message',
			id: 'receiving_messages'
		});
	});

	test('recoverMessagesSubSection should return a specific result', () => {
		expect(recoverMessagesSubSection()).toEqual({
			label: 'label.recover_messages',
			id: 'recover_messages'
		});
	});

	test('trustedAddressesSubSection should return a specific result', () => {
		expect(trustedAddressesSubSection()).toEqual({
			label: 'label.trusted_addresses',
			id: 'trusted_addresses'
		});
	});

	test('signaturesSubSection should return a specific result', () => {
		expect(signaturesSubSection()).toEqual({
			label: 'signatures.signature_heading',
			id: 'signatures'
		});
	});

	test('setDefaultSignaturesSubSection should return a specific result', () => {
		expect(setDefaultSignaturesSubSection()).toEqual({
			label: 'label.using_signatures',
			id: 'using_signatures'
		});
	});

	test('filtersSubSection should return a specific result', () => {
		expect(filtersSubSection()).toEqual({
			label: 'filters.filters',
			id: 'filters'
		});
	});

	test('allowedSendersSubSection should return a specific result', () => {
		expect(allowedSendersSubSection()).toEqual({
			label: 'label.allowed_addresses',
			id: 'allowed_addresses'
		});
	});

	test('blockedSendersSubSection should return a specific result', () => {
		expect(blockedSendersSubSection()).toEqual({
			label: 'label.blocked_addresses',
			id: 'blocked_addresses'
		});
	});
});
