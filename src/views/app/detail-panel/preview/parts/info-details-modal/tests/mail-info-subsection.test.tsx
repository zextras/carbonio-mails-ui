/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen } from '@testing-library/react';

import { setupTest } from '../../../../../../../carbonio-ui-commons/test/test-setup';
import { MailInfoSubsection } from '../mail-info-subsection';

describe('MailInfoSubsection', () => {
	test('correctly renders the component when both attributes are present', () => {
		const messageIdFromMailHeaders = '12345';
		const creationDateFromMailHeaders = '2021-01-01';
		setupTest(
			<MailInfoSubsection
				messageIdFromMailHeaders={messageIdFromMailHeaders}
				creationDateFromMailHeaders={creationDateFromMailHeaders}
			/>
		);
		expect(screen.getByTestId('mail-info-subsection')).toBeInTheDocument();
		expect(screen.getByText('General Information')).toBeInTheDocument();
		expect(screen.getByText('Message ID:')).toBeInTheDocument();
		expect(screen.getByText(messageIdFromMailHeaders)).toBeInTheDocument();
		expect(screen.getByText('Created at:')).toBeInTheDocument();
		expect(screen.getByText(creationDateFromMailHeaders)).toBeInTheDocument();
	});

	test('returns empty fragment when both messageIdFromMailHeaders and creationDateFromMailHeaders are undefined', () => {
		const messageIdFromMailHeaders = undefined;
		const creationDateFromMailHeaders = undefined;
		setupTest(
			<MailInfoSubsection
				messageIdFromMailHeaders={messageIdFromMailHeaders}
				creationDateFromMailHeaders={creationDateFromMailHeaders}
			/>
		);
		expect(screen.queryByTestId('mail-info-subsection')).not.toBeInTheDocument();
		expect(screen.queryByText('Message ID:')).not.toBeInTheDocument();
		expect(screen.queryByText('Created at:')).not.toBeInTheDocument();
	});

	test('does not display the line title when the creation date value is not provided', () => {
		const messageIdFromMailHeaders = '12345';
		const creationDateFromMailHeaders = undefined;
		setupTest(
			<MailInfoSubsection
				messageIdFromMailHeaders={messageIdFromMailHeaders}
				creationDateFromMailHeaders={creationDateFromMailHeaders}
			/>
		);
		expect(screen.getByText('Message ID:')).toBeInTheDocument();
		expect(screen.queryByText('Created at:')).not.toBeInTheDocument();
	});

	test('does not display the line title when the message id value is not provided', () => {
		const messageIdFromMailHeaders = undefined;
		const creationDateFromMailHeaders = '2021-01-01';
		setupTest(
			<MailInfoSubsection
				messageIdFromMailHeaders={messageIdFromMailHeaders}
				creationDateFromMailHeaders={creationDateFromMailHeaders}
			/>
		);
		expect(screen.queryByText('Message ID:')).not.toBeInTheDocument();
		expect(screen.getByText('Created at:')).toBeInTheDocument();
	});
});
