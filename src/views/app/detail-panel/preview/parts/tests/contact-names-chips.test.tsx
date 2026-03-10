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
import { Participant } from 'types/participant';
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
		setupTest(<ContactNameChip {...props} isWide />);
		const chips = screen.getAllByTestId('chip-', { exact: false });
		expect(chips.length).toBe(contacts.length);
	});

	it('renders the label correctly', async () => {
		setupTest(<ContactNameChip {...props} isWide />);
		const expectedLabel = screen.getByText(label);
		expect(expectedLabel).toBeVisible();
	});

	it('renders each contact with the correct name and address', async () => {
		setupTest(<ContactNameChip {...props} isWide />);

		contacts.forEach((contact) => {
			expect(screen.getByTestId(`chip-${contact.address}`)).toBeVisible();
			expect(screen.getByText(generateChipName(contact))).toBeVisible();
			expect(screen.getByText(contact.address)).toBeVisible();
		});
	});

	it('calls sendMsg when Send e-mail icon is clicked', async () => {
		const sendIcon = /icon: EmailOutline/i;

		const { user } = setupTest(<ContactNameChip {...props} isWide />);
		await user.click(screen.getAllByRoleWithIcon('button', { icon: sendIcon })[0]);
		expect(sendMsg).toHaveBeenCalledWith(contacts[0]);
	});

	it('calls copyEmailToClipboard when Copy icon is clicked', async () => {
		const copyIcon = /icon: Copy/i;
		const { user } = setupTest(<ContactNameChip {...props} isWide />);
		await user.click(screen.getAllByRoleWithIcon('button', { icon: copyIcon })[0]);
		expect(copyEmailToClipboard).toHaveBeenCalledWith(contacts[0].address, expect.anything());
	});
});

describe('Compact view (isWide: false)', () => {
	it('renders only the first contact chip in compact view', () => {
		setupTest(<ContactNameChip {...props} isWide={false} />);

		// Only the first contact chip should be visible
		expect(screen.getByTestId(`chip-${contacts[0].address}`)).toBeVisible();
		expect(screen.getByText(contacts[0].address)).toBeVisible();
	});

	it('does not initially render other contacts in compact view', () => {
		setupTest(<ContactNameChip {...props} isWide={false} />);

		// Second contact should not be visible initially
		expect(screen.queryByText(generateChipName(contacts[1]))).not.toBeInTheDocument();
	});

	it('shows badge with correct count of remaining contacts', () => {
		setupTest(<ContactNameChip {...props} isWide={false} />);

		const badge = screen.getByText(`+${contacts.length - 1}`);
		expect(badge).toBeVisible();
	});

	it('does not show badge when only one contact exists', () => {
		const singleContactProps = {
			...props,
			contacts: [contacts[0]]
		};

		setupTest(<ContactNameChip {...singleContactProps} isWide={false} />);

		expect(screen.queryByText(/^\+/)).not.toBeInTheDocument();
	});

	it('opens dropdown when badge is clicked', async () => {
		const { user } = setupTest(<ContactNameChip {...props} isWide={false} />);

		const badge = screen.getByText(`+${contacts.length - 1}`);
		await user.click(badge);

		// After clicking badge, remaining contacts should be visible
		expect(screen.getByText(generateChipName(contacts[1]))).toBeVisible();
		expect(screen.getByText(contacts[1].address)).toBeVisible();
	});

	it('displays all remaining contacts in dropdown', async () => {
		const { user } = setupTest(<ContactNameChip {...props} isWide={false} />);

		const badge = screen.getByText(`+${contacts.length - 1}`);
		await user.click(badge);

		// All contacts except the first should be in the dropdown
		contacts.slice(1).forEach((contact) => {
			expect(screen.getByText(generateChipName(contact))).toBeVisible();
			expect(screen.getByText(contact.address)).toBeVisible();
		});
	});

	it('calls sendMsg when Send e-mail icon in first chip is clicked', async () => {
		const sendIcon = /icon: EmailOutline/i;

		const { user } = setupTest(<ContactNameChip {...props} isWide={false} />);
		await user.click(screen.getByRoleWithIcon('button', { icon: sendIcon }));
		expect(sendMsg).toHaveBeenCalledWith(contacts[0]);
	});

	it('calls copyEmailToClipboard when Copy icon in first chip is clicked', async () => {
		const copyIcon = /icon: Copy/i;
		const { user } = setupTest(<ContactNameChip {...props} isWide={false} />);
		await user.click(screen.getByRoleWithIcon('button', { icon: copyIcon }));
		expect(copyEmailToClipboard).toHaveBeenCalledWith(contacts[0].address, expect.anything());
	});

	it('can interact with contacts inside dropdown', async () => {
		const sendIcon = /icon: EmailOutline/i;

		const { user } = setupTest(<ContactNameChip {...props} isWide={false} />);

		// Open dropdown
		const badge = screen.getByText(`+${contacts.length - 1}`);
		await user.click(badge);

		// Click send email on a contact in the dropdown
		const sendButtons = screen.getAllByRoleWithIcon('button', { icon: sendIcon });
		await user.click(sendButtons[1]); // First button is the main chip, second is in dropdown

		expect(sendMsg).toHaveBeenCalledWith(contacts[1]);
	});

	it('shows expanded avatar for contacts in dropdown', async () => {
		const { user } = setupTest(<ContactNameChip {...props} isWide={false} />);

		// Open dropdown
		const badge = screen.getByText(`+${contacts.length - 1}`);
		await user.click(badge);

		// Contacts in dropdown should have expanded chips (with avatars)
		expect(screen.getByText(generateChipName(contacts[1]))).toBeVisible();
	});

	it('handles many contacts in compact view', () => {
		const manyContacts = Array.from({ length: 10 }, (_, i) => ({
			...partcipant1,
			address: `user${i}@example.com`,
			email: `user${i}@example.com`,
			name: `User ${i}`,
			fullName: `User ${i} Name`
		}));

		const manyContactsProps = {
			...props,
			contacts: manyContacts
		};

		setupTest(<ContactNameChip {...manyContactsProps} isWide={false} />);

		expect(screen.getByText('+9')).toBeVisible();
	});

	it('stops event propagation when badge is clicked', async () => {
		const { user } = setupTest(<ContactNameChip {...props} isWide={false} />);

		const badge = screen.getByText(`+${contacts.length - 1}`);
		await user.click(badge);

		// dropdown should be open
		expect(screen.getByText(generateChipName(contacts[1]))).toBeVisible();
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

describe('CompactView handleCopyEmailToClipboard', () => {
	it('should call copyEmailToClipboard with correct contact address and createSnackbar', async () => {
		const { user } = setupTest(<ContactNameChip {...props} isWide={false} />);

		// Open dropdown to access contacts
		const badge = screen.getByText('+1');
		await user.click(badge);

		const copyIcon = /icon: Copy/i;
		const copyButtons = screen.getAllByRoleWithIcon('button', { icon: copyIcon });
		await user.click(copyButtons[1]);

		expect(copyEmailToClipboard).toHaveBeenCalledWith(contacts[1].address, expect.any(Function));
	});

	it('should handle SyntheticEvent properly in handleCopyEmailToClipboard', async () => {
		const { user } = setupTest(<ContactNameChip {...props} isWide={false} />);

		const badge = screen.getByText('+1');
		await user.click(badge);

		const copyIcon = /icon: Copy/i;
		const copyButtons = screen.getAllByRoleWithIcon('button', { icon: copyIcon });

		await user.click(copyButtons[1]);

		expect(copyEmailToClipboard).toHaveBeenCalledTimes(1);
	});
});
