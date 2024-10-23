/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { act } from 'react';

import { useModal } from '@zextras/carbonio-design-system';

import { setupTest, screen } from '../../../../../../carbonio-ui-commons/test/test-setup';
import { IncompleteMessage } from '../../../../../../types';
import { MailInfoBlock } from '../mail-info-block';

// Mock useModal hook
jest.mock('@zextras/carbonio-design-system', () => ({
	...jest.requireActual('@zextras/carbonio-design-system'),
	useModal: jest.fn()
}));

const mockCreateModal = jest.fn();
const mockCloseModal = jest.fn();

(useModal as jest.Mock).mockReturnValue({
	createModal: mockCreateModal,
	closeModal: mockCloseModal
});
const validSignature = {
	certificate: {
		issuer: {
			trusted: true,
			name: 'Trusted CA'
		},
		email: 'user@example.com',
		notBefore: 1697884800000,
		notAfter: 1729420800000
	},
	type: 'smime',
	messageCode: 'VALID',
	message: 'Signature is valid.',
	valid: true
};
const authenticationHeaders = {
	spf: { value: 'spf-value', pass: true },
	dkim: { value: 'dkim-value', pass: true },
	dmarc: { value: 'dmarc-value', pass: true }
};

const mockMsg: IncompleteMessage = {
	signature: [validSignature],
	sensitivity: 'Private',
	creationDateFromMailHeaders: '2022-01-01',
	messageIdFromMailHeaders: 'test-message-id',
	authenticationHeaders,
	isFromDistributionList: true,
	isFromExternalDomain: true
} as IncompleteMessage;

describe('MailInfoBlock', () => {
	it('correctly renders the show details link', () => {
		setupTest(<MailInfoBlock msg={mockMsg} />);
		expect(screen.getByText('Show Details')).toBeInTheDocument();
	});

	it('renders SmimeIcon when signature is present', () => {
		setupTest(<MailInfoBlock msg={mockMsg} />);
		expect(screen.getByTestId('smime-icon')).toBeInTheDocument();
	});

	it('renders ExternalDomainIcon when isFromExternalDomain is true', () => {
		setupTest(<MailInfoBlock msg={mockMsg} />);
		expect(screen.getByTestId('external-domain-icon')).toBeInTheDocument();
	});

	it('renders MailSensitivityIcon when sensitivity is present', () => {
		setupTest(<MailInfoBlock msg={mockMsg} />);
		expect(screen.getByTestId('mail-sensitivity-icon')).toBeInTheDocument();
	});

	it('renders MailAuthenticationHeaderIcon when authenticationHeaders are present', () => {
		setupTest(<MailInfoBlock msg={mockMsg} />);
		expect(screen.getByTestId('mail-authentication-header-icon')).toBeInTheDocument();
	});

	it('renders DistributionListIcon when isFromDistributionList is true', () => {
		setupTest(<MailInfoBlock msg={mockMsg} />);
		expect(screen.getByTestId('distribution-list-icon')).toBeInTheDocument();
	});

	it('opens modal when "Show Details" link is clicked', async () => {
		const { user } = setupTest(<MailInfoBlock msg={mockMsg} />);

		await act(async () => {
			await user.click(screen.getByText('Show Details'));
		});
		expect(mockCreateModal).toHaveBeenCalled();
	});

	it('does not render the show details link when no valid value is passed', () => {
		setupTest(<MailInfoBlock msg={{} as IncompleteMessage} />);
		expect(screen.queryByText('Show Details')).not.toBeInTheDocument();
	});

	it('does not render the show details link when non relevant values are passed', () => {
		const message = {
			sensitivity: 'Invalid',
			authenticationHeaders: { invalidHeader: { value: 'generic value', pass: true } }
		} as unknown as IncompleteMessage;

		setupTest(<MailInfoBlock msg={message} />);
		expect(screen.queryByText('Show Details')).not.toBeInTheDocument();
	});
});
