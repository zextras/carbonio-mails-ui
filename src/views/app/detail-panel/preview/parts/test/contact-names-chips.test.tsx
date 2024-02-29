/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { faker } from '@faker-js/faker';

import { ParticipantRoleType } from '../../../../../../carbonio-ui-commons/constants/participants';
import { setupTest, screen } from '../../../../../../carbonio-ui-commons/test/test-setup';
import { generateStore } from '../../../../../../tests/generators/store';
import { Participant } from '../../../../../../types';
import { ContactNameChip } from '../contact-names-chips';

const firstName1 = faker.person.firstName();
const firstName2 = faker.person.firstName();
const email1 = faker.internet.email();
const email2 = faker.internet.email();
const partcipant1 = {
	name: firstName1,
	fullName: `${firstName1} ${faker.person.lastName()}`,
	email: email1,
	error: false,
	isGroup: false,
	address: email1,
	type: 't' as ParticipantRoleType
};
const contacts: Array<Participant> = [
	partcipant1,
	{
		...partcipant1,
		email: email2,
		address: email2,
		name: firstName2,
		fullName: `${firstName2} ${faker.person.lastName()}`
	}
];
describe('Attachments visualization', () => {
	it('should render the contact names component with the exact number of chips', async () => {
		const props = {
			contacts,
			label: 'To'
		};
		const store = generateStore();
		setupTest(<ContactNameChip {...props} />, { store });
		const chips = screen.getAllByTestId('chip-', { exact: false });
		expect(chips.length).toBe(contacts.length);
	});
});
