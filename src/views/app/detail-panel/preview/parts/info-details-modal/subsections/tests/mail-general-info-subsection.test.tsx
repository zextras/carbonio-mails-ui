/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen } from '@testing-library/react';

import { setupTest } from '@test-setup';
import { MailGeneralInfoSubsection } from 'views/app/detail-panel/preview/parts/info-details-modal/subsections/mail-general-info-subsection';

describe('MailInfoSubsection', () => {
	it('correctly renders the component when both attributes are present', () => {
		const messageIdFromMailHeaders = '12345';
		const creationDateFromMailHeaders = '2021-01-01';
		setupTest(
			<MailGeneralInfoSubsection
				messageIdFromMailHeaders={messageIdFromMailHeaders}
				creationDateFromMailHeaders={creationDateFromMailHeaders}
				messageIsFromDistributionList
				messageIsFromExternalDomain
				sensitivityValue={'Private'}
			/>
		);
		expect(screen.getByTestId('mail-info-subsection')).toBeInTheDocument();
		expect(screen.getByText('General Information')).toBeInTheDocument();
		expect(screen.getByText('Message ID:')).toBeInTheDocument();
		expect(screen.getByText(messageIdFromMailHeaders)).toBeInTheDocument();
		expect(screen.getByText('Created at:')).toBeInTheDocument();
		expect(screen.getByText(creationDateFromMailHeaders)).toBeInTheDocument();
		expect(screen.getByText('This email is from a Distribution List')).toBeInTheDocument();
	});

	test('MessageId element shows tooltip', async () => {
		const messageIdFromMailHeaders = '12345';
		const { user } = setupTest(
			<MailGeneralInfoSubsection messageIdFromMailHeaders={messageIdFromMailHeaders} />
		);

		await user.hover(screen.getByText('12345'));
		expect(await screen.findByTestId('tooltip')).toHaveTextContent('12345');
	});

	it('returns only general info if no values are provided', () => {
		setupTest(<MailGeneralInfoSubsection />);

		expect(screen.getByText('General Information')).toBeInTheDocument();
	});

	it('does not display the line title when the creation date value is not provided', () => {
		setupTest(
			<MailGeneralInfoSubsection
				messageIdFromMailHeaders={'12345'}
				creationDateFromMailHeaders={undefined}
				messageIsFromDistributionList={false}
				messageIsFromExternalDomain={false}
				sensitivityValue={'Private'}
			/>
		);
		expect(screen.getByText('Message ID:')).toBeInTheDocument();
		expect(screen.queryByText('Created at:')).not.toBeInTheDocument();
	});

	it('does not display the line title when the message id value is not provided', () => {
		setupTest(
			<MailGeneralInfoSubsection
				messageIdFromMailHeaders={undefined}
				creationDateFromMailHeaders={'2021-01-01'}
				messageIsFromDistributionList={false}
				messageIsFromExternalDomain={false}
				sensitivityValue={'Private'}
			/>
		);
		expect(screen.queryByText('Message ID:')).not.toBeInTheDocument();
		expect(screen.getByText('Created at:')).toBeInTheDocument();
	});

	it('does not display the distribuiton list information when the value is not false', () => {
		setupTest(
			<MailGeneralInfoSubsection
				messageIdFromMailHeaders={undefined}
				creationDateFromMailHeaders={'2021-01-01'}
				messageIsFromDistributionList={false}
				messageIsFromExternalDomain={false}
				sensitivityValue={'Private'}
			/>
		);
		expect(screen.getByTestId('mail-info-subsection')).toBeInTheDocument();
		expect(screen.queryByText('From Distribution List')).not.toBeInTheDocument();
	});
});
