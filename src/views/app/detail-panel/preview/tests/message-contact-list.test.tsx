/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { faker } from '@faker-js/faker';
import { screen } from '@testing-library/react';

import { ParticipantRole } from '../../../../../carbonio-ui-commons/constants/participants';
import { setupTest } from '../../../../../carbonio-ui-commons/test/test-setup';
import { generateMessage } from '../../../../../tests/generators/generateMessage';
import MessageContactList from '../parts/message-contact-list';

describe('MessageContactList', () => {
	const toParticipant = { type: ParticipantRole.TO, address: faker.internet.email() };
	const ccParticipant = { type: ParticipantRole.CARBON_COPY, address: faker.internet.email() };
	it('should render the "To" field with contacts', () => {
		const message = generateMessage({
			to: [toParticipant],
			cc: [ccParticipant]
		});

		setupTest(<MessageContactList message={message} contactListExpandCB={jest.fn()} />);

		const toRow = screen.getByTestId('ContactNamesToRow');
		expect(toRow).toBeInTheDocument();
		expect(toRow).toHaveTextContent(`label.to: ${toParticipant.address}`);
	});
});
