/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { act } from 'react';

import { faker } from '@faker-js/faker';
import { screen } from '@testing-library/react';
import { ParticipantRole } from '@zextras/carbonio-ui-commons';

import { setupTest } from '@test-setup';
import { generateMessage } from '__test__/generators/generateMessage';
import MessageContactList from 'views/app/detail-panel/preview/parts/message-contact-list';

describe('MessageContactList', () => {
	const toParticipant = { type: ParticipantRole.TO, address: faker.internet.email() };
	const ccParticipant = { type: ParticipantRole.CARBON_COPY, address: faker.internet.email() };
	it('should render the "To" field with contacts', () => {
		const message = generateMessage({
			to: [toParticipant],
			cc: [ccParticipant]
		});

		setupTest(<MessageContactList message={message} contactListExpandCB={vi.fn()} />);

		const toRow = screen.getByTestId('ContactNamesToRow');
		expect(toRow).toBeInTheDocument();
		expect(toRow).toHaveTextContent(`label.to: ${toParticipant.address}`);
	});

	it(`should render the [Empty 'To' Field] field with contacts`, () => {
		const message = generateMessage({
			to: [],
			cc: [ccParticipant]
		});

		setupTest(<MessageContactList message={message} contactListExpandCB={vi.fn()} />);

		const toRow = screen.getByTestId('ContactNamesToRow');
		expect(toRow).toBeInTheDocument();
		expect(toRow).toHaveTextContent(`label.to: recipient.toField.missing`);
	});

	it(`should render the To and Cc fields with contacts`, async () => {
		const message = generateMessage({
			to: [toParticipant],
			cc: [ccParticipant]
		});

		setupTest(<MessageContactList message={message} contactListExpandCB={vi.fn()} />);

		const toRow = screen.getByTestId('ContactNamesToRow');
		expect(toRow).toBeInTheDocument();
		expect(toRow).toHaveTextContent(`label.to: ${toParticipant.address}`);

		const ccRow = screen.getByTestId('ContactNamesCcRow');
		expect(ccRow).toBeInTheDocument();
		expect(ccRow).toHaveTextContent(`label.cc: ${ccParticipant.address}`);
	});

	it(`should collapse and remove Cc field`, async () => {
		const message = generateMessage({
			to: [toParticipant],
			cc: [ccParticipant]
		});

		const { user } = setupTest(
			<MessageContactList message={message} contactListExpandCB={vi.fn()} />
		);

		const contactsListToggleIcon = screen.getByTestId('contacs-list-toggle-icon');
		await act(async () => {
			await user.click(contactsListToggleIcon);
		});

		expect(screen.queryByTestId(`ContactNamesCcRow`)).not.toBeInTheDocument();
	});

	it(`should display contact list toggle icon with collapse`, async () => {
		const message = generateMessage({
			cc: [ccParticipant]
		});
		const { user } = setupTest(
			<MessageContactList message={message} contactListExpandCB={vi.fn()} />
		);
		const toggleDownIcon = await screen.findByTestId('icon: ChevronDown');
		expect(toggleDownIcon).toBeInTheDocument();
		await act(async () => {
			await user.click(toggleDownIcon);
		});
		const toggleIcon = await screen.findByTestId('icon: ChevronUp');
		expect(toggleIcon).toBeInTheDocument();
	});
});
