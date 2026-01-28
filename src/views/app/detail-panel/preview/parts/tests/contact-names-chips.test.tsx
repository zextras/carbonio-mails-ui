/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { faker } from '@faker-js/faker';
import { ParticipantRoleType } from '@zextras/carbonio-ui-commons';
import { omit } from 'lodash';

import { screen, setupTest } from '@test-setup';
import { Participant } from 'types/index.d';
import { copyEmailToClipboard, sendMsg } from 'ui-actions/participant-displayer-actions';
import {
	ContactNameChip,
	generateChipName
} from 'views/app/detail-panel/preview/parts/contact-names-chips';

vi.mock('../../../../../../ui-actions/participant-displayer-actions', () => ({
	sendMsg: vi.fn(),
	copyEmailToClipboard: vi.fn()
}));

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

const label = 'To';
const props = {
	contacts,
	label
};

describe('Attachments visualization', () => {
	it('renders the contact names component with the exact number of chips', async () => {
		setupTest(<ContactNameChip {...props} isWide={true} />);
		const chips = screen.getAllByTestId('chip-', { exact: false });
		expect(chips.length).toBe(contacts.length);
	});

	it('renders the label correctly', async () => {
		setupTest(<ContactNameChip {...props} isWide={true} />);
		const expectedLabel = screen.getByText(label);
		expect(expectedLabel).toBeInTheDocument();
	});

	it('renders each contact with the correct name and address', async () => {
		setupTest(<ContactNameChip {...props} isWide={true} />);

		contacts.forEach((contact) => {
			expect(screen.getByTestId(`chip-${contact.address}`)).toBeInTheDocument();
			expect(screen.getByText(generateChipName(contact))).toBeInTheDocument();
			expect(screen.getByText(contact.address)).toBeInTheDocument();
		});
	});

	it('calls sendMsg when Send e-mail icon is clicked', async () => {
		const sendIcon = /icon: EmailOutline/i;

		const { user } = setupTest(<ContactNameChip {...props} isWide={true} />);
		await user.click(screen.getAllByRoleWithIcon('button', { icon: sendIcon })[0]);
		expect(sendMsg).toHaveBeenCalledWith(contacts[0]);
	});

	it('calls copyEmailToClipboard when Copy icon is clicked', async () => {
		const copyIcon = /icon: Copy/i;
		const { user } = setupTest(<ContactNameChip {...props} isWide={true} />);
		await user.click(screen.getAllByRoleWithIcon('button', { icon: copyIcon })[0]);
		expect(copyEmailToClipboard).toHaveBeenCalledWith(contacts[0].address, expect.anything());
	});
});

describe('generateChipName', () => {
	it('should capitalize the first letter of a single name', () => {
		const contact = { ...partcipant1, fullName: undefined, name: 'john' };
		const result = generateChipName(contact);
		expect(result).toBe('John');
	});

	it('should use fullName over name if both are present', () => {
		const contact = { ...partcipant1, fullName: 'john doe', name: 'john' };
		const result = generateChipName(contact);
		expect(result).toBe('John Doe');
	});

	it('should return name with quotes if it contains a comma', () => {
		const contact = { ...partcipant1, fullName: 'doe, john' };
		const result = generateChipName(contact);
		expect(result).toBe('"Doe, John"');
	});

	it('should return an empty string if both name and fullName are missing', () => {
		const contact = omit({ ...partcipant1 }, ['name', 'fullName']);
		const result = generateChipName(contact);
		expect(result).toBe('');
	});

	it('should return an empty string if name and fullName are empty strings', () => {
		const contact = { ...partcipant1, name: '', fullName: '' };
		const result = generateChipName(contact);
		expect(result).toBe('');
	});
});
