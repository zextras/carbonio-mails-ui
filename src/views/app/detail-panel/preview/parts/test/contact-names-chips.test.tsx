/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { faker } from '@faker-js/faker';
import { useSnackbar } from '@zextras/carbonio-design-system';
import { omit } from 'lodash';

import { ParticipantRoleType } from '../../../../../../carbonio-ui-commons/constants/participants';
import { setupTest, screen } from '../../../../../../carbonio-ui-commons/test/test-setup';
import { generateStore } from '../../../../../../tests/generators/store';
import { Participant } from '../../../../../../types';
import {
	copyEmailToClipboard,
	sendMsg
} from '../../../../../../ui-actions/participant-displayer-actions';
import { ContactNameChip, generateChipName } from '../contact-names-chips';

jest.mock('../../../../../../ui-actions/participant-displayer-actions', () => ({
	sendMsg: jest.fn(),
	copyEmailToClipboard: jest.fn()
}));

jest.mock('@zextras/carbonio-design-system', () => ({
	...jest.requireActual('@zextras/carbonio-design-system'), // This line preserves other exports from the module
	useSnackbar: jest.fn()
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
		const store = generateStore();
		setupTest(<ContactNameChip {...props} />, { store });
		const chips = screen.getAllByTestId('chip-', { exact: false });
		expect(chips.length).toBe(contacts.length);
	});

	it('renders the label correctly', async () => {
		const store = generateStore();
		setupTest(<ContactNameChip {...props} />, { store });
		const expectedLabel = screen.getByText(label);
		expect(expectedLabel).toBeInTheDocument();
	});

	it('renders each contact with the correct name and address', async () => {
		const store = generateStore();
		setupTest(<ContactNameChip {...props} />, { store });

		contacts.forEach((contact) => {
			expect(screen.getByTestId(`chip-${contact.address}`)).toBeInTheDocument();
			expect(screen.getByText(generateChipName(contact))).toBeInTheDocument();
			expect(screen.getByText(contact.address)).toBeInTheDocument();
		});
	});

	it('calls sendMsg when Send e-mail icon is clicked', async () => {
		const sendIcon = /icon: EmailOutline/i;
		const store = generateStore();

		const { user } = setupTest(<ContactNameChip {...props} />, { store });
		await user.click(screen.getAllByRoleWithIcon('button', { icon: sendIcon })[0]);
		expect(sendMsg).toHaveBeenCalledWith(contacts[0]);
	});

	it('calls copyEmailToClipboard when Copy icon is clicked', async () => {
		const copyIcon = /icon: Copy/i;
		const store = generateStore();

		const createSnackbar = useSnackbar();
		const { user } = setupTest(<ContactNameChip {...props} />, { store });
		await user.click(screen.getAllByRoleWithIcon('button', { icon: copyIcon })[0]);
		expect(copyEmailToClipboard).toHaveBeenCalledWith(contacts[0].address, createSnackbar);
	});
});

describe('generateChipName', () => {
	it('should capitalize the first letter of a single name', () => {
		const contact = { ...partcipant1, fullName: '', name: 'john' };
		const result = generateChipName(contact);
		expect(result).toBe('John');
	});

	it('should use fullName over name if both are present', () => {
		const contact = { ...partcipant1, fullName: 'john doe', name: 'john' };
		const result = generateChipName(contact);
		expect(result).toBe('John Doe');
	});

	it('should return capitalized name with quotes if it contains a comma', () => {
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
